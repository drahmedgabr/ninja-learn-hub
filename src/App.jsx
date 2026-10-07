import { useEffect, useState } from "react";
import { Routes, Route, Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Compass, LayoutDashboard,
  Menu, Play, Plus, Pencil, Trash2, ShieldCheck, X, LogOut, Save,
  Video, FolderPlus, LockKeyhole, RefreshCw
} from "lucide-react";
import { api, getApiError } from "./api";

function Logo() {
  return <Link className="brand" to="/"><span className="brand-mark"><ShieldCheck size={20} /></span><span className="brand-copy"><strong>Ninja Learn</strong><small>Learn • Practice • Perform</small></span></Link>;
}

function Sidebar({ open, close }) {
  const loc = useLocation();
  const [topics, setTopics] = useState([]);
  useEffect(() => { api.topics().then(setTopics).catch(() => setTopics([])); }, []);
  return <>
    <div className={`sidebar-backdrop ${open ? "is-open" : ""}`} onClick={close} />
    <aside className={`sidebar ${open ? "is-open" : ""}`}>
      <div className="sidebar-top"><Logo /><button className="icon-btn mobile-only" onClick={close}><X size={20} /></button></div>
      <nav className="sidebar-nav">
        <p className="nav-label">Training Topics</p>
        {topics.map(t => <Link key={t.id} className={`topic-link ${loc.pathname.includes(String(t.id)) ? "active" : ""}`} to={t.videos?.length ? `/training/${t.id}/video/${t.videos[0].id}` : `/training/${t.id}`} onClick={close}><span className="topic-dot" /><span>{t.title}</span></Link>)}
        {!topics.length && <span className="sidebar-empty">No training added yet.</span>}
      </nav>
      <div className="sidebar-footer">
        <Link className={`admin-link ${loc.pathname.startsWith("/admin") ? "active" : ""}`} to="/admin" onClick={close}><LayoutDashboard size={17} />Admin Control Panel</Link>
        <small>© 2026 Ninja Learn</small>
      </div>
    </aside>
  </>;
}

function Layout({ children }) {
  const [open, setOpen] = useState(false);
  return <div className="app-shell"><Sidebar open={open} close={() => setOpen(false)} /><div className="main-shell"><button className="floating-menu mobile-only" onClick={() => setOpen(true)}><Menu size={21} /></button><main className="page-content">{children}</main></div></div>;
}

function EmptyState({ title = "No training available yet", description = "Training topics will appear here once they are added from the admin control panel." }) {
  return <div className="empty-state"><div className="empty-icon"><BookOpen size={28} /></div><span className="section-kicker">Learning Hub</span><h2>{title}</h2><p>{description}</p><Link className="button button--primary" to="/admin">Open Control Panel <ArrowRight size={16} /></Link></div>;
}

function TrainingCard({ topic }) {
  const firstVideo = topic.videos?.[0];
  const target = firstVideo ? `/training/${topic.id}/video/${firstVideo.id}` : `/training/${topic.id}`;
  return <article className="training-card"><div className="training-card-top"><div className="course-icon"><BookOpen size={22} /></div><span className="badge">Training Topic</span></div><div className="training-card-body"><div className="eyebrow">Ninja Learn</div><h3>{topic.title}</h3><p>{topic.description}</p></div><div className="training-card-footer"><Link className="button button--primary button--small" to={target}>View Training <ArrowRight size={15} /></Link></div></article>;
}

function Dashboard() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.topics().then(setTopics).catch(() => setTopics([])).finally(() => setLoading(false)); }, []);
  return <div className="page-enter"><section className="hero hero--compact"><div className="hero-copy"><span className="section-kicker">Learning Hub</span><h1>Learn with purpose.<br /><em>Perform with confidence.</em></h1><p>Choose a training topic and start learning.</p></div></section><section className="section-block" id="training"><div className="section-heading"><div><span className="section-kicker">Your curriculum</span><h2>Training topics</h2><p>Choose a topic to start your training.</p></div></div>{loading ? <div className="loading-state"><RefreshCw className="spin" size={20} />Loading training...</div> : topics.length ? <div className="training-grid">{topics.map(t => <TrainingCard key={t.id} topic={t} />)}</div> : <EmptyState />}</section></div>;
}

function WasabiPlayer({ video, title }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(Boolean(video.storage_key));
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!video.storage_key) { setLoading(false); return; }
    setLoading(true);
    setError("");
    api.videoUrl(video.id)
      .then(nextUrl => { if (!cancelled) setUrl(nextUrl); })
      .catch(err => { if (!cancelled) setError(getApiError(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [video.id, video.storage_key]);

  if (loading) return <div className="player-placeholder"><RefreshCw className="spin" size={24} /><strong>Preparing secure video...</strong><span>The protected training video is being prepared.</span></div>;
  if (url) return <div className="youtube-frame media-player"><video src={url} controls playsInline preload="metadata" controlsList="nodownload" onContextMenu={e => e.preventDefault()} aria-label={title} /></div>;
  if (error && !video.youtube_id) return <div className="player-placeholder"><div className="player-placeholder-icon"><Play size={23} fill="currentColor" /></div><strong>Video unavailable</strong><span>{error}</span></div>;
  if (video.youtube_id) return <div className="youtube-frame"><iframe src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtube_id)}?enablejsapi=1&rel=0&playsinline=1&iv_load_policy=3`} title={title} allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture;web-share" allowFullScreen /></div>;
  return <div className="player-placeholder"><div className="player-placeholder-icon"><Play size={23} fill="currentColor" /></div><strong>Video is not configured</strong><span>Add a Wasabi object key from the admin panel.</span></div>;
}

function VideoPage() {
  const { trainingId, videoId } = useParams();
  const [topic, setTopic] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api.topic(trainingId).then(setTopic).catch(e => setError(getApiError(e))); }, [trainingId]);
  if (error) return <NotFound message={error} />;
  if (!topic) return <div className="loading-state page-loading"><RefreshCw className="spin" size={20} />Loading lesson...</div>;
  const videos = topic.videos || [];
  const video = videos.find(v => String(v.id) === String(videoId));
  if (!video) return <NotFound />;
  const index = videos.findIndex(v => String(v.id) === String(videoId));
  const prev = videos[index - 1], next = videos[index + 1];
  return <div className="watch-page page-enter">
    <div className="watch-top"><Link to="/" className="back-link"><ArrowLeft size={17} />Back to training</Link><span className="watch-breadcrumb">{topic.title}</span></div>
    <div className="watch-layout"><main>
      <YouTubePlayer id={video.youtube_id} title={video.title} />
      <div className="watch-content">
        <div className="watch-title-row"><div><span className="section-kicker">Video {String(video.video_order).padStart(2, "0")} · Training</span><h1>{video.title}</h1></div></div>
        <p className="watch-description">{video.description}</p>
      </div>
      <div className="watch-navigation">
        {prev ? <Link className="video-nav" to={`/training/${topic.id}/video/${prev.id}`}><ArrowLeft size={19} /><span><small>Previous</small><strong>{prev.title}</strong></span></Link> : <span />}
        {next ? <Link className="video-nav video-nav--next" to={`/training/${topic.id}/video/${next.id}`}><span><small>Next lesson</small><strong>{next.title}</strong></span><ArrowRight size={19} /></Link> : <Link className="button button--primary" to="/">Back to training <BookOpen size={16} /></Link>}
      </div>
    </main><aside className="watch-sidebar"><div className="watch-sidebar-header"><div><span className="section-kicker">Course playlist</span><h3>{topic.title}</h3></div><span>{index + 1}/{videos.length}</span></div><div className="playlist">{videos.map(v => <Link key={v.id} className={`playlist-item ${String(v.id) === String(videoId) ? "active" : ""}`} to={`/training/${topic.id}/video/${v.id}`}><span className="playlist-number">{String(v.video_order).padStart(2, "0")}</span><span className="playlist-copy"><strong>{v.title}</strong>{v.duration && <small>{v.duration}</small>}</span></Link>)}</div></aside></div>
  </div>;
}

function TrainingDetail() {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  useEffect(() => { api.topic(id).then(setTopic).catch(() => setTopic(null)); }, [id]);
  if (!topic) return <div className="loading-state"><RefreshCw className="spin" size={20} />Loading training...</div>;
  if (topic.videos?.length) return <NavigateToVideo topic={topic} />;
  return <div className="page-enter"><Link to="/" className="back-link"><ArrowLeft size={17} />Back to training</Link><EmptyState title="No videos in this topic yet" description="Add the first video from the admin control panel." /></div>;
}

function NavigateToVideo({ topic }) {
  const navigate = useNavigate();
  useEffect(() => { navigate(`/training/${topic.id}/video/${topic.videos[0].id}`, { replace: true }); }, [navigate, topic]);
  return <div className="loading-state"><RefreshCw className="spin" size={20} />Opening training...</div>;
}

function NotFound({ message = "The page may have moved or the link may be incorrect." }) {
  return <div className="not-found page-enter"><div className="not-found-icon"><Compass size={28} /></div><span className="section-kicker">404</span><h1>We couldn't find that training.</h1><p>{message}</p><Link className="button button--primary" to="/"><ArrowLeft size={16} />Back to home</Link></div>;
}

function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e) { e.preventDefault(); setError(""); setLoading(true); try { await api.login(password); onLogin(); } catch (err) { setError(getApiError(err)); } finally { setLoading(false); } }
  return <div className="admin-login page-enter"><div className="admin-login-card"><div className="admin-lock"><LockKeyhole size={25} /></div><span className="section-kicker">Ninja Learn</span><h1>Admin Control Panel</h1><p>Sign in to manage training topics and videos.</p><form onSubmit={submit}><label>Admin password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus /></label>{error && <div className="form-error">{error}</div>}<button className="button button--primary button--full" disabled={loading}>{loading ? "Signing in..." : "Sign in"} <ArrowRight size={16} /></button></form></div></div>;
}

function TopicForm({ initial, onSaved, onCancel }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [saving, setSaving] = useState(false);
  async function submit(e) { e.preventDefault(); setSaving(true); try { const topic = initial ? await api.updateTopic(initial.id, { title, description }) : await api.createTopic({ title, description }); onSaved(topic); } catch (err) { alert(getApiError(err)); } finally { setSaving(false); } }
  return <form className="admin-form" onSubmit={submit}><div className="form-grid"><label>Topic title<input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Pharmacy Consultation Excellence" /></label><label>Description<textarea value={description} onChange={e => setDescription(e.target.value)} required rows="4" placeholder="Short description for the training topic" /></label></div><div className="form-actions"><button type="button" className="button button--secondary" onClick={onCancel}>Cancel</button><button className="button button--primary" disabled={saving}><Save size={15} />{saving ? "Saving..." : "Save topic"}</button></div></form>;
}

function VideoForm({ topicId, initial, onSaved, onCancel }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [storageKey, setStorageKey] = useState(initial?.storage_key || "");
  const [duration, setDuration] = useState(initial?.duration || "");
  const [order, setOrder] = useState(initial?.video_order || "");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { title, description, storage_key: storageKey, youtube_id: initial?.youtube_id || "", duration, video_order: order ? Number(order) : undefined };
      const video = initial ? await api.updateVideo(initial.id, payload) : await api.createVideo(topicId, payload);
      onSaved(video);
    } catch (err) { alert(getApiError(err)); }
    finally { setSaving(false); }
  }

  return <form className="admin-form" onSubmit={submit}><div className="form-grid">
    <label>Video title<input value={title} onChange={e => setTitle(e.target.value)} required /></label>
    <label>Wasabi object key<input value={storageKey} onChange={e => setStorageKey(e.target.value)} required placeholder="videos/intercom/video-01.mp4" /><span className="field-help">Upload the MP4 to your private Wasabi bucket, then paste its object key here.</span></label>
    <label>Duration <span className="optional">optional</span><input value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 57:37" /></label>
    <label>Order <span className="optional">optional</span><input type="number" min="1" value={order} onChange={e => setOrder(e.target.value)} placeholder="1" /></label>
    <label className="full-field">Description<textarea value={description} onChange={e => setDescription(e.target.value)} required rows="4" /></label>
  </div><div className="form-note">Videos are served through short-lived Wasabi signed URLs. Keep the Wasabi bucket private.</div>
  <div className="form-actions"><button type="button" className="button button--secondary" onClick={onCancel}>Cancel</button><button className="button button--primary" disabled={saving}><Save size={15} />{saving ? "Saving..." : "Save video"}</button></div></form>;
}

function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(null);
  const [topics, setTopics] = useState([]);
  const [topicForm, setTopicForm] = useState(null);
  const [videoForm, setVideoForm] = useState(null);
  const [openTopic, setOpenTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load() { setLoading(true); try { setTopics(await api.topics(true)); setError(""); } catch (e) { setError(getApiError(e)); } finally { setLoading(false); } }
  useEffect(() => { api.auth().then(r => setAuthenticated(r.authenticated)).catch(() => setAuthenticated(false)); }, []);
  useEffect(() => { if (authenticated) load(); }, [authenticated]);
  if (authenticated === null) return <div className="loading-state page-loading"><RefreshCw className="spin" size={20} />Checking admin access...</div>;
  if (!authenticated) return <AdminLogin onLogin={() => setAuthenticated(true)} />;
  async function deleteTopic(id) { if (!confirm("Delete this topic and all of its videos?")) return; try { await api.deleteTopic(id); await load(); } catch (e) { alert(getApiError(e)); } }
  async function deleteVideo(id) { if (!confirm("Delete this video?")) return; try { await api.deleteVideo(id); await load(); } catch (e) { alert(getApiError(e)); } }
  return <div className="admin-page page-enter"><div className="admin-header"><div><span className="section-kicker">Management</span><h1>Training Control Panel</h1><p>Add and manage your live training content.</p></div><div className="admin-actions"><button className="button button--secondary" onClick={async () => { await api.logout(); setAuthenticated(false); }}><LogOut size={15} />Sign out</button><button className="button button--primary" onClick={() => setTopicForm({ mode: "create" })}><Plus size={16} />Add topic</button></div></div>{error && <div className="form-error admin-error">{error}</div>}{loading ? <div className="loading-state"><RefreshCw className="spin" size={20} />Loading content...</div> : <div className="admin-topics">{topics.map(topic => <section className="admin-topic" key={topic.id}><div className="admin-topic-header"><div><span className="eyebrow">Training topic</span><h2>{topic.title}</h2><p>{topic.description}</p></div><div className="row-actions"><button className="icon-btn" title="Edit topic" onClick={() => setTopicForm({ mode: "edit", topic })}><Pencil size={17} /></button><button className="icon-btn danger" title="Delete topic" onClick={() => deleteTopic(topic.id)}><Trash2 size={17} /></button></div></div><div className="admin-video-head"><strong><Video size={16} /> Videos</strong><button className="button button--secondary button--small" onClick={() => setVideoForm({ mode: "create", topic })}><Plus size={14} />Add video</button></div>{topic.videos?.length ? <div className="admin-video-list">{topic.videos.map(video => <div className="admin-video-row" key={video.id}><span className="admin-video-number">{String(video.video_order).padStart(2, "0")}</span><div><strong>{video.title}</strong><span>{video.storage_key || "Legacy YouTube video"}{video.duration ? ` · ${video.duration}` : ""}</span></div><div className="row-actions"><button className="icon-btn" title="Edit video" onClick={() => setVideoForm({ mode: "edit", video, topic })}><Pencil size={16} /></button><button className="icon-btn danger" title="Delete video" onClick={() => deleteVideo(video.id)}><Trash2 size={16} /></button></div></div>)}</div> : <div className="admin-empty">No videos yet. Add the first lesson.</div>}</section>)}{!topics.length && <EmptyState title="Your library is empty" description="Create your first training topic to start building the live curriculum." />}</div>}{topicForm && <div className="modal-backdrop"><div className="modal"><div className="modal-head"><div><span className="section-kicker">{topicForm.mode === "edit" ? "Edit topic" : "New topic"}</span><h2>{topicForm.mode === "edit" ? "Update training topic" : "Create training topic"}</h2></div><button className="icon-btn" onClick={() => setTopicForm(null)}><X size={19} /></button></div><TopicForm initial={topicForm.topic} onCancel={() => setTopicForm(null)} onSaved={() => { setTopicForm(null); load(); }} /></div></div>}{videoForm && <div className="modal-backdrop"><div className="modal"><div className="modal-head"><div><span className="section-kicker">{videoForm.mode === "edit" ? "Edit video" : "New video"}</span><h2>{videoForm.mode === "edit" ? "Update lesson" : `Add lesson to ${videoForm.topic.title}`}</h2></div><button className="icon-btn" onClick={() => setVideoForm(null)}><X size={19} /></button></div><VideoForm topicId={videoForm.topic.id} initial={videoForm.video} onCancel={() => setVideoForm(null)} onSaved={() => { setVideoForm(null); load(); }} /></div></div>}</div>;
}

export default function App() {
  return <Layout><Routes><Route path="/" element={<Dashboard />} /><Route path="/training/:id" element={<TrainingDetail />} /><Route path="/training/:trainingId/video/:videoId" element={<VideoPage />} /><Route path="/admin" element={<AdminPanel />} /><Route path="*" element={<NotFound />} /></Routes></Layout>;
}
