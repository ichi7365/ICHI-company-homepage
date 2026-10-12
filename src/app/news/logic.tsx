'use client';

/* 회사소식 — 공지사항 · 회사소식 목록/상세 + 관리자 전용 작성·수정·삭제.
   화면 구성은 인재채용(careers) 게시판을 그대로 따릅니다 (시안 없음).
   저장은 lib/repo/posts.ts → Cloudflare Worker(/api/posts) 로 갑니다.

   상세 주소는 /news?id=<글 id> 입니다 (정적 export 라 쿼리스트링 사용).
   본문은 HTML 이라 화면에 넣기 전에 항상 DOMPurify 로 정리합니다. */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
  type MouseEvent,
} from 'react';
import DOMPurify from 'dompurify';
import { useAuth } from '@/lib/auth';
import {
  createPost,
  deleteFile,
  deletePost,
  getPost,
  listAllPosts,
  listPosts,
  updatePost,
  uploadFile,
} from '@/lib/repo/posts';
import type { Post, PostCategory, PostFile, PostSummary } from '@/types/database';

const PAGE_SIZE = 10;

const CATEGORY_LABEL: Record<PostCategory, string> = { notice: '공지사항', news: '회사소식' };

type Filter = 'all' | PostCategory;
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'notice', label: '공지사항' },
  { key: 'news', label: '회사소식' },
];

type Draft = {
  category: PostCategory;
  title: string;
  isNotice: boolean;
  isPublished: boolean;
  files: PostFile[];
};

/** 저장 시각(UTC) → 한국 날짜 2026.10.12 */
const kstDate = (iso: string) => {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? '' : new Date(t + 9 * 3_600_000).toISOString().slice(0, 10).replace(/-/g, '.');
};

const fmtSize = (n: number) =>
  n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(n / 1024))}KB`;

/** 본문 HTML 정리 — 스크립트 · 이벤트 속성 등을 제거합니다 (서버 렌더 시에는 빈 문자열) */
const sanitize = (html: string) => (DOMPurify.isSupported ? DOMPurify.sanitize(html) : '');

/** 본문에 들어간 업로드 이미지의 R2 key */
const imageKeys = (html: string) =>
  Array.from(html.matchAll(/src="\/api\/files\/([^"?#]+)"/g), (m) => decodeURIComponent(m[1]));

const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

const urlId = () => new URLSearchParams(window.location.search).get('id');

export function useVars() {
  const { ready, isAdmin, toast, confirm } = useAuth();

  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<PostSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const [view, setView] = useState<'list' | 'detail' | 'edit'>('list');
  const [detail, setDetail] = useState<Post | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  /* 본문 편집기 — 글자를 칠 때마다 다시 그리면 커서가 튀므로 상태 대신 DOM 을 직접 씁니다 */
  const editorRef = useRef<HTMLDivElement | null>(null);
  const initialHtml = useRef('');
  const savedRange = useRef<Range | null>(null);
  /** 이번 편집에서 새로 올린 파일 — 저장하지 않고 나가면 지웁니다 */
  const pending = useRef<Set<string>>(new Set());

  /* ---------- 목록 ---------- */

  const reload = useCallback(async () => {
    try {
      const opts = { category: filter === 'all' ? undefined : filter, page, size: PAGE_SIZE };
      const res = isAdmin ? await listAllPosts(opts) : await listPosts(opts);
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      toast(e instanceof Error ? e.message : '게시글을 불러오지 못했습니다.');
    } finally {
      setLoaded(true);
    }
  }, [filter, page, isAdmin, toast]);

  useEffect(() => {
    if (ready) void reload();
  }, [ready, reload]);

  /* ---------- 상세 (주소 /news?id=…) ---------- */

  const showList = useCallback((push: boolean) => {
    if (push && urlId()) window.history.pushState(null, '', '/news');
    setView('list');
    setDetail(null);
    setEditingId(null);
    setDraft(null);
  }, []);

  const openDetail = useCallback(
    async (id: string, push: boolean) => {
      try {
        const post = await getPost(id);
        setDetail(post);
        setView('detail');
        if (push) window.history.pushState(null, '', `/news?id=${encodeURIComponent(id)}`);
        toTop();
      } catch (e) {
        toast(e instanceof Error ? e.message : '게시글을 찾을 수 없습니다.');
        showList(false);
        window.history.replaceState(null, '', '/news');
      }
    },
    [toast, showList]
  );

  /* 처음 들어올 때 주소에 id 가 있으면 바로 상세, 뒤로가기 · 앞으로가기도 따라갑니다 */
  useEffect(() => {
    if (!ready) return;
    const id = urlId();
    if (id) void openDetail(id, false);
    const onPop = () => {
      const next = urlId();
      if (next) void openDetail(next, false);
      else showList(false);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // 최초 1회만 — openDetail · showList 는 안정적인 함수입니다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  /* ---------- 관리자 ---------- */

  const deny = useCallback(() => toast('관리자 계정만 이용 가능한 기능입니다.'), [toast]);

  const discardPending = () => {
    pending.current.forEach((key) => void deleteFile(key).catch(() => {}));
    pending.current.clear();
  };

  const startCreate = () => {
    if (!isAdmin) return deny();
    initialHtml.current = '';
    savedRange.current = null;
    setEditingId(null);
    setDraft({
      category: filter === 'news' ? 'news' : 'notice',
      title: '',
      isNotice: false,
      isPublished: true,
      files: [],
    });
    setView('edit');
    toTop();
  };

  const startEdit = async (id: string) => {
    if (!isAdmin) return deny();
    try {
      const post = detail?.id === id ? detail : await getPost(id);
      initialHtml.current = sanitize(post.content);
      savedRange.current = null;
      setEditingId(id);
      setDraft({
        category: post.category,
        title: post.title,
        isNotice: post.is_notice,
        isPublished: post.is_published,
        files: post.files.filter((f) => f.kind === 'attachment'),
      });
      setView('edit');
      toTop();
    } catch (e) {
      toast(e instanceof Error ? e.message : '게시글을 불러오지 못했습니다.');
    }
  };

  /* 편집 화면이 열리면 본문을 채웁니다 */
  useEffect(() => {
    if (view === 'edit' && editorRef.current) editorRef.current.innerHTML = initialHtml.current;
  }, [view, editingId]);

  const removePost = (id: string) => {
    if (!isAdmin) return deny();
    confirm({
      title: '게시글 삭제',
      body: '이 게시글을 삭제하시겠습니까?\n첨부파일과 이미지도 함께 삭제되며 복구할 수 없습니다.',
      confirmText: '삭제',
      danger: true,
      onConfirm: async () => {
        try {
          await deletePost(id);
          toast('게시글이 삭제되었습니다.');
          showList(true);
          await reload();
        } catch (err) {
          toast(err instanceof Error ? err.message : '삭제에 실패했습니다.');
        }
      },
    });
  };

  /* --- 본문 편집기 --- */

  const rememberSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && editorRef.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  /** 편집기에 커서를 되돌립니다 (없으면 맨 끝) */
  const restoreSelection = () => {
    const ed = editorRef.current;
    if (!ed) return;
    ed.focus();
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    if (savedRange.current) {
      sel.addRange(savedRange.current);
    } else {
      const r = document.createRange();
      r.selectNodeContents(ed);
      r.collapse(false);
      sel.addRange(r);
    }
  };

  /* execCommand 는 오래된 API 지만 모든 브라우저에서 동작하고, 이 정도 편집에는 충분합니다 */
  const exec = (cmd: string, arg?: string) => (e: MouseEvent) => {
    e.preventDefault(); // 버튼을 눌러도 편집기의 선택 영역이 풀리지 않게
    restoreSelection();
    document.execCommand(cmd, false, arg);
    rememberSelection();
  };

  /* 붙여넣기는 글자만 — 워드 · 웹페이지 서식이 섞여 들어오는 것을 막습니다 */
  const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
  };

  const pickImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    for (const file of files) {
      try {
        setBusy(true);
        const up = await uploadFile(file, { kind: 'image' });
        pending.current.add(up.key);
        restoreSelection();
        document.execCommand('insertImage', false, up.url);
        rememberSelection();
      } catch (err) {
        toast(err instanceof Error ? err.message : '이미지를 올리지 못했습니다.');
      } finally {
        setBusy(false);
      }
    }
  };

  /* --- 첨부파일 --- */

  const pickAttachments = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    for (const file of files) {
      try {
        setBusy(true);
        const up = await uploadFile(file, { kind: 'attachment' });
        pending.current.add(up.key);
        setDraft((d) => (d ? { ...d, files: [...d.files, up] } : d));
      } catch (err) {
        toast(err instanceof Error ? `${file.name}: ${err.message}` : '파일을 올리지 못했습니다.');
      } finally {
        setBusy(false);
      }
    }
  };

  const removeAttachment = (f: PostFile) => {
    const drop = async () => {
      try {
        await deleteFile(f.key);
        pending.current.delete(f.key);
        setDraft((d) => (d ? { ...d, files: d.files.filter((x) => x.key !== f.key) } : d));
      } catch (err) {
        toast(err instanceof Error ? err.message : '첨부파일을 삭제하지 못했습니다.');
      }
    };
    /* 이미 저장된 파일은 바로 지워지므로 한 번 확인합니다 */
    if (pending.current.has(f.key)) void drop();
    else
      confirm({
        title: '첨부파일 삭제',
        body: `'${f.filename}' 파일을 삭제하시겠습니까?\n저장 버튼을 누르지 않아도 바로 삭제됩니다.`,
        confirmText: '삭제',
        danger: true,
        onConfirm: () => void drop(),
      });
  };

  /* --- 저장 --- */

  const save = async () => {
    if (!isAdmin) return deny();
    if (!draft || busy) return;

    const title = draft.title.trim();
    const html = sanitize(editorRef.current?.innerHTML ?? '');
    const hasText = (editorRef.current?.textContent ?? '').trim().length > 0;
    if (!title) return toast('제목을 입력해 주세요.');
    if (!hasText && !/<img\b/i.test(html)) return toast('내용을 입력해 주세요.');

    const imgs = imageKeys(html);
    const input = {
      category: draft.category,
      title,
      content: html,
      /* 대표 이미지는 본문의 첫 번째 이미지 */
      image_url: imgs[0] ? `/api/files/${imgs[0]}` : null,
      is_notice: draft.isNotice,
      is_published: draft.isPublished,
      file_keys: Array.from(new Set(imgs.concat(draft.files.map((f) => f.key)))),
    };

    setBusy(true);
    try {
      const saved = editingId ? await updatePost(editingId, input) : await createPost(input);
      pending.current.clear();
      toast(editingId ? '게시글이 수정되었습니다.' : '게시글이 등록되었습니다.');
      setEditingId(null);
      setDraft(null);
      setDetail(saved);
      setView('detail');
      window.history.pushState(null, '', `/news?id=${encodeURIComponent(saved.id)}`);
      toTop();
      void reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const cancelEdit = () => {
    discardPending();
    if (editingId && detail?.id === editingId) {
      setEditingId(null);
      setDraft(null);
      setView('detail');
    } else {
      showList(true);
    }
    toTop();
  };

  /* ---------- 화면에 넘길 값 ---------- */

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const rows = items.map((p, i) => ({
    key: p.id,
    no: p.is_notice ? '공지' : String(total - (page - 1) * PAGE_SIZE - i).padStart(2, '0'),
    noClass: p.is_notice ? 'jb-no nd-pin' : 'jb-no',
    title: p.title,
    sub: `${CATEGORY_LABEL[p.category]} · 조회 ${p.view_count.toLocaleString()}`,
    date: kstDate(p.created_at),
    badge: p.is_published ? CATEGORY_LABEL[p.category] : '비공개',
    badgeClass: p.is_published && p.category === 'notice' ? 'status-open' : 'status-closed',
    rowClass: p.is_published ? '' : 'closed',
    open: () => void openDetail(p.id, true),
    edit: (e: MouseEvent) => {
      e.stopPropagation();
      void startEdit(p.id);
    },
    del: (e: MouseEvent) => {
      e.stopPropagation();
      removePost(p.id);
    },
  }));

  const post = detail
    ? {
        title: detail.title,
        meta: `${kstDate(detail.created_at)} · 조회 ${detail.view_count.toLocaleString()}`,
        badge: detail.is_published ? CATEGORY_LABEL[detail.category] : '비공개',
        badgeClass: detail.is_published && detail.category === 'notice' ? 'status-open' : 'status-closed',
        html: sanitize(detail.content),
        /* 본문에 넣지 않고 이미지로 첨부만 한 파일 (옛 홈페이지 갤러리 글) — 본문 아래에 보여줍니다 */
        images: detail.files
          .filter((f) => f.kind === 'image' && !detail.content.includes(f.url))
          .map((f) => ({ key: f.key, url: f.url, name: f.filename })),
        files: detail.files
          .filter((f) => f.kind === 'attachment')
          .map((f) => ({ key: f.key, url: f.url, name: f.filename, size: fmtSize(f.size) })),
      }
    : null;

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  const form = draft
    ? {
        draft,
        setCategory: (e: FormEvent) => set('category', (e.target as HTMLSelectElement).value as PostCategory),
        setPublished: (e: FormEvent) => set('isPublished', (e.target as HTMLSelectElement).value === '1'),
        setTitle: (e: FormEvent) => set('title', (e.target as HTMLInputElement).value),
        setNotice: (e: FormEvent) => set('isNotice', (e.target as HTMLInputElement).checked),
        files: draft.files.map((f) => ({
          key: f.key,
          name: f.filename,
          size: fmtSize(f.size),
          remove: () => removeAttachment(f),
        })),
      }
    : null;

  return {
    admin: isAdmin,
    filters: FILTERS.map((f) => ({
      key: f.key,
      label: f.label,
      cls: 'adm-chip' + (filter === f.key ? ' on' : ''),
      pick: () => {
        setFilter(f.key);
        setPage(1);
      },
    })),
    rows,
    empty: loaded && rows.length === 0,
    pager: pages > 1,
    pageButtons: Array.from({ length: pages }, (_, i) => ({
      n: i + 1,
      cls: 'nd-page' + (page === i + 1 ? ' on' : ''),
      go: () => {
        setPage(i + 1);
        toTop();
      },
    })),
    prevDisabled: page <= 1,
    nextDisabled: page >= pages,
    prev: () => setPage((p) => Math.max(1, p - 1)),
    next: () => setPage((p) => Math.min(pages, p + 1)),

    showList: view === 'list',
    showDetail: view === 'detail' && !!post,
    showEdit: view === 'edit' && !!form,
    post: post as NonNullable<typeof post>,
    f: form as NonNullable<typeof form>,
    formTitle: editingId ? '게시글 수정' : '게시글 작성',
    saveLabel: busy ? '처리 중…' : editingId ? '수정 완료' : '등록하기',
    busy,

    create: startCreate,
    back: () => showList(true),
    detailEdit: () => detail && void startEdit(detail.id),
    detailDel: () => detail && removePost(detail.id),
    save: () => void save(),
    cancel: cancelEdit,

    editorRef,
    rememberSelection,
    onPaste,
    bold: exec('bold'),
    heading: exec('formatBlock', 'h3'),
    paragraph: exec('formatBlock', 'p'),
    list: exec('insertUnorderedList'),
    pickImage,
    pickAttachments,
  };
}
