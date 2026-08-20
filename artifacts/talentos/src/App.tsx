import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, Show, SignIn, SignUp, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  CircleDot,
  ClipboardCheck,
  Clock3,
  Code2,
  Database,
  ExternalLink,
  FileText,
  Filter,
  Gauge,
  LayoutDashboard,
  LibraryBig,
  LockKeyhole,
  MapPin,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  UsersRound,
  Trash2,
  Workflow,
  Brain,
  X,
  Zap,
} from 'lucide-react';
import {
  getGetAnalyticsFunnelQueryKey,
  getGetDashboardActivityQueryKey,
  getGetDashboardSummaryQueryKey,
  getHealthCheckQueryKey,
  getListAssessmentsQueryKey,
  getListAutomationsQueryKey,
  getListCandidatesQueryKey,
  getListJobsQueryKey,
  getListKnowledgeSourcesQueryKey,
  useGetAnalyticsFunnel,
  useGetDashboardActivity,
  useGetDashboardSummary,
  useHealthCheck,
  useEvaluateCandidateForJob,
  useCreateCandidate,
  useCreateAssessment,
  useCreateJob,
  useCreateKnowledgeSource,
  useCreateAutomation,
  useDeleteCandidate,
  useDeleteAssessment,
  useDeleteJob,
  useDeleteKnowledgeSource,
  useDeleteAutomation,
  useListAssessments,
  useListAutomations,
  useListCandidates,
  useListJobs,
  useListKnowledgeSources,
  useQueryKnowledge,
  useUpdateKnowledgeSource,
  useUpdateAutomation,
} from '@workspace/api-client-react';
import type { Candidate } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Link, Redirect, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string) {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#e97861',
    colorForeground: '#1a2d3b',
    colorMutedForeground: '#6d7981',
    colorDanger: '#bd3d3d',
    colorBackground: '#fffdf8',
    colorInput: '#fffdf8',
    colorInputForeground: '#1a2d3b',
    colorNeutral: '#d9d0c0',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '0.65rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fffdf8] rounded-2xl w-[440px] max-w-full overflow-hidden',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#1a2d3b]',
    headerSubtitle: 'text-[#6d7981]',
    socialButtonsBlockButtonText: 'text-[#1a2d3b]',
    formFieldLabel: 'text-[#1a2d3b]',
    footerActionLink: 'text-[#16766a]',
    footerActionText: 'text-[#6d7981]',
    dividerText: 'text-[#6d7981]',
    identityPreviewEditButton: 'text-[#16766a]',
    formFieldSuccessText: 'text-[#16766a]',
    alertText: 'text-[#bd3d3d]',
    logoBox: 'h-12',
    logoImage: 'max-h-12',
    socialButtonsBlockButton: 'border-[#d9d0c0] bg-[#fffdf8]',
    formButtonPrimary: 'bg-[#1a2d3b] text-[#fffdf8]',
    formFieldInput: 'border-[#d9d0c0] bg-[#fffdf8]',
    footerAction: 'border-[#d9d0c0]',
    dividerLine: 'bg-[#d9d0c0]',
    alert: 'border-[#bd3d3d]',
    otpCodeFieldInput: 'border-[#d9d0c0]',
    formFieldRow: 'gap-2',
    main: 'bg-transparent',
  },
};

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/candidates', label: 'Candidates', icon: UsersRound },
  { href: '/assessments', label: 'Assessments', icon: ClipboardCheck },
  { href: '/knowledge', label: 'Knowledge', icon: LibraryBig },
  { href: '/automations', label: 'Automations', icon: Workflow },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
};

const formatRelative = (value: string) => {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  if (Number.isNaN(date.getTime())) return value;
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

function StatusPill({ value }: { value: string }) {
  const label = value.replaceAll('_', ' ');
  const tone = value === 'open' || value === 'active' || value === 'ready' || value === 'shortlisted'
    ? 'good'
    : value === 'paused' || value === 'processing' || value === 'screening' || value === 'assessment' || value === 'needs_review'
      ? 'warm'
      : value === 'closed' || value === 'archived' || value === 'rejected'
        ? 'quiet'
        : 'neutral';
  return <span data-testid={`status-pill-${value}`} className={`status-pill status-${tone}`}><span className="status-dot" />{label}</span>;
}

function MetricCard({ label, value, detail, icon: Icon, accent = 'teal' }: {
  label: string; value: string | number; detail: string; icon: typeof Gauge; accent?: string;
}) {
  return (
    <div className="metric-card rise-in" data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}>
      <div className="flex items-start justify-between gap-3">
        <span className={`metric-icon metric-${accent}`}><Icon size={17} strokeWidth={1.8} /></span>
        <ArrowUpRight size={15} className="text-muted-foreground" />
      </div>
      <div className="mt-5">
        <div className="metric-value">{value}</div>
        <div className="metric-label">{label}</div>
        <div className="metric-detail">{detail}</div>
      </div>
    </div>
  );
}

function LoadingRows({ count = 4 }: { count?: number }) {
  return <div className="space-y-3" data-testid="loading-state">{Array.from({ length: count }).map((_, index) => (
    <div className="skeleton h-[68px] rounded-xl" key={index} />
  ))}</div>;
}

function DataState({ loading, error, empty, onRetry, children }: {
  loading: boolean; error: boolean; empty: boolean; onRetry: () => void; children: ReactNode;
}) {
  if (loading) return <LoadingRows />;
  if (error) return (
    <div className="empty-state" data-testid="error-state">
      <div className="empty-icon error-icon"><CircleAlert size={22} /></div>
      <h3>Signal interrupted</h3>
      <p>We could not load this workspace view. The rest of your command center is still available.</p>
      <button data-testid="button-retry" className="button-secondary" onClick={onRetry}><RefreshCw size={15} /> Try again</button>
    </div>
  );
  if (empty) return (
    <div className="empty-state" data-testid="empty-state">
      <div className="empty-icon"><Database size={22} /></div>
      <h3>No records in this view</h3>
      <p>As your hiring work arrives, TalentOS will turn it into a decision-ready signal here.</p>
    </div>
  );
  return <>{children}</>;
}

function SectionHeader({ eyebrow, title, description, action }: {
  eyebrow: string; title: ReactNode; description?: string; action?: ReactNode;
}) {
  return (
    <div className="section-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const { user } = useUser();
  const { signOut } = useClerk();
  const { data: health } = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), staleTime: 60_000 } });
  const current = navItems.find((item) => item.href === location);
  const triggerNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2800);
  };

  return (
    <div className="app-frame noise">
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-top">
          <Link href="/" className="brand-lockup" data-testid="link-brand" onClick={() => setMobileOpen(false)}>
            <span className="brand-mark"><span /></span>
            <span><strong>TalentOS</strong><small>Hiring intelligence</small></span>
          </Link>
          <button className="mobile-close" data-testid="button-close-navigation" onClick={() => setMobileOpen(false)}><X size={18} /></button>
        </div>
        <div className="workspace-switcher" data-testid="button-workspace-switcher">
          <span className="workspace-avatar">N</span>
          <span className="min-w-0"><b>Northstar Labs</b><small>Recruiting workspace</small></span>
          <ChevronDown size={14} className="ml-auto text-sidebar-foreground/60" />
        </div>
        <div className="nav-heading">Workspace</div>
        <nav className="sidebar-nav" aria-label="Workspace navigation">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              href={href}
              key={href}
              data-testid={`link-nav-${label.toLowerCase()}`}
              className={`nav-item ${location === href ? 'nav-active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={17} strokeWidth={location === href ? 2.2 : 1.7} />
              <span>{label}</span>
              {label === 'Candidates' && <span className="nav-count">24</span>}
            </Link>
          ))}
        </nav>
        <div className="nav-heading nav-heading-lower">Workspace admin</div>
        <Link href="/settings" data-testid="link-nav-settings" className={`nav-item ${location === '/settings' ? 'nav-active' : ''}`} onClick={() => setMobileOpen(false)}>
          <Settings2 size={17} /><span>Settings</span>
        </Link>
        <div className="sidebar-bottom">
          <div className="privacy-card">
            <ShieldCheck size={16} />
            <div><b>Trust layer on</b><span>Candidate data is protected</span></div>
          </div>
          <div className="profile-row">
            <span className="profile-avatar">{(user?.firstName?.[0] ?? 'A')}{(user?.lastName?.[0] ?? 'M')}</span>
            <span><b>{user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? 'Talent partner'}</b><small>Workspace member</small></span>
            <button className="more-button" aria-label="Sign out" onClick={() => signOut({ redirectUrl: basePath || '/' })}><MoreHorizontal size={17} className="text-sidebar-foreground/50" /></button>
          </div>
        </div>
      </aside>
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" data-testid="button-navigation-scrim" onClick={() => setMobileOpen(false)} />}
      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu" data-testid="button-open-navigation" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><b>{current?.label ?? 'Settings'}</b></div>
          <div className="topbar-actions">
            <div className="health-indicator" data-testid="status-api-health"><span className={health?.status === 'ok' ? 'online-dot' : 'online-dot offline'} />{health?.status === 'ok' ? 'Live data' : 'Checking data'}</div>
            <button className="icon-button" data-testid="button-notifications" onClick={() => triggerNotice('You are all caught up.') }><Bell size={18} /><span className="notification-dot" /></button>
            <button className="avatar-button" data-testid="button-profile" onClick={() => triggerNotice('Profile settings are in workspace settings.')}>AM</button>
          </div>
        </header>
        {notice && <div className="notice-toast" data-testid="status-notice"><CheckCircle2 size={16} />{notice}</div>}
        <div className="page-scroll">{children}</div>
      </main>
    </div>
  );
}

function Overview() {
  const summaryQuery = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const activityQuery = useGetDashboardActivity({ query: { queryKey: getGetDashboardActivityQueryKey() } });
  const summary = summaryQuery.data;
  const activity = activityQuery.data ?? [];
  return (
    <div className="page-content">
      <SectionHeader
        eyebrow="Tuesday, October 22 · Northstar Labs"
        title={<>Good morning, Alex <span className="serif-accent">—</span><br /><span className="title-muted">here’s the hiring signal.</span></>}
        description="A clear read on what needs your attention across the hiring workspace."
        action={<button className="button-primary" data-testid="button-new-requisition" onClick={() => window.alert('Requisition creation is coming in the next workspace release.')}><Plus size={16} /> New requisition</button>}
      />
      <DataState loading={summaryQuery.isLoading} error={summaryQuery.isError} empty={!summary} onRetry={() => summaryQuery.refetch()}>
        {summary && <div className="metric-grid">
          <MetricCard label="Active jobs" value={summary.activeJobs} detail="2 need a decision" icon={Briefcase} accent="coral" />
          <MetricCard label="Candidates in motion" value={summary.totalCandidates} detail="8 new this week" icon={UsersRound} accent="teal" />
          <MetricCard label="Technical assessments" value={summary.technicalAssessments} detail="71% completion rate" icon={Code2} accent="amber" />
          <MetricCard label="Interviews scheduled" value={summary.interviewsScheduled} detail="Next one in 42 min" icon={CalendarDays} accent="plum" />
          <MetricCard label="Shortlisted" value={summary.shortlisted} detail="Across 6 open roles" icon={Sparkles} accent="coral" />
          <MetricCard label="Average match" value={`${summary.averageMatch}%`} detail="Up 4.8% vs last month" icon={Gauge} accent="teal" />
        </div>}
      </DataState>
      <div className="dashboard-lower">
        <section className="panel activity-panel rise-in delay-1">
          <div className="panel-heading"><div><div className="eyebrow">Live feed</div><h2>Recent activity</h2></div><Link href="/candidates" className="text-link" data-testid="link-view-activity">View candidates <ArrowRight size={14} /></Link></div>
          <DataState loading={activityQuery.isLoading} error={activityQuery.isError} empty={!activity.length} onRetry={() => activityQuery.refetch()}>
            <div className="activity-list">{activity.map((event) => (
              <div className="activity-row" key={event.id} data-testid={`activity-${event.id}`}>
                <div className={`activity-icon activity-${event.type}`}><Activity size={15} /></div>
                <div className="activity-copy"><b>{event.title}</b><span>{event.description}</span><small>{event.actor} · {formatRelative(event.occurredAt)}</small></div>
                <ArrowUpRight size={14} className="activity-arrow" />
              </div>
            ))}</div>
          </DataState>
        </section>
        <section className="panel attention-panel rise-in delay-2">
          <div className="panel-heading"><div><div className="eyebrow">Decision queue</div><h2>Worth a look</h2></div><span className="queue-count">04</span></div>
          <div className="attention-stack">
            <div className="attention-item"><span className="attention-symbol"><Clock3 size={16} /></span><div><b>2 interviews need feedback</b><span>Keep the scorecard signal clean.</span></div><ArrowRight size={14} /></div>
            <div className="attention-item"><span className="attention-symbol coral"><CircleAlert size={16} /></span><div><b>Backend role is slowing</b><span>12 applicants, 1 moved in 7 days.</span></div><ArrowRight size={14} /></div>
            <div className="attention-item"><span className="attention-symbol amber"><Zap size={16} /></span><div><b>Assessment signal is strong</b><span>Platform Engineer is at 84% average.</span></div><ArrowRight size={14} /></div>
          </div>
          <div className="panel-footer-note"><Sparkles size={14} /> AI summaries are generated from your workspace evidence.</div>
        </section>
      </div>
      <div className="insight-strip"><div className="insight-mark"><Sparkles size={16} /></div><div><b>One useful read</b><span>Roles with a technical screen are reaching shortlist 1.6× faster this month.</span></div><Link href="/analytics" data-testid="link-insight-analytics">Explore funnel <ArrowRight size={14} /></Link></div>
    </div>
  );
}

function Jobs() {
  const query = useListJobs({ query: { queryKey: getListJobsQueryKey() } });
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const jobs = query.data ?? [];
  const filtered = useMemo(() => jobs.filter((job) => (filter === 'all' || job.status === filter) && `${job.title} ${job.department} ${job.location}`.toLowerCase().includes(search.toLowerCase())), [jobs, filter, search]);
  return <div className="page-content">
    <SectionHeader eyebrow="Hiring pipeline" title="Jobs" description="Requisitions, demand, and movement across your open roles." action={<button className="button-primary" data-testid="button-add-job" onClick={() => window.alert('Requisition creation is coming in the next workspace release.')}><Plus size={16} /> Add job</button>} />
    <div className="toolbar"><div className="search-box"><Search size={16} /><input data-testid="input-search-jobs" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search jobs, teams, locations" /></div><div className="filter-group"><SlidersHorizontal size={15} /><button data-testid="button-filter-all" className={filter === 'all' ? 'filter-active' : ''} onClick={() => setFilter('all')}>All jobs</button><button data-testid="button-filter-open" className={filter === 'open' ? 'filter-active' : ''} onClick={() => setFilter('open')}>Open</button><button data-testid="button-filter-paused" className={filter === 'paused' ? 'filter-active' : ''} onClick={() => setFilter('paused')}>Paused</button></div></div>
    <DataState loading={query.isLoading} error={query.isError} empty={!filtered.length} onRetry={() => query.refetch()}>
      <div className="jobs-layout"><div className="job-list">{filtered.map((job, index) => <article className={`job-card rise-in delay-${Math.min(index + 1, 3)}`} key={job.id} data-testid={`card-job-${job.id}`}><div className="job-card-top"><span className="job-badge">{job.department.slice(0, 2).toUpperCase()}</span><StatusPill value={job.status} /><button className="more-button" data-testid={`button-job-menu-${job.id}`} onClick={() => window.alert(`Actions for ${job.title}`)}><MoreHorizontal size={17} /></button></div><h2>{job.title}</h2><div className="job-meta"><span><Building2 size={14} />{job.department}</span><span><MapPin size={14} />{job.location}</span><span>{job.employmentType.replaceAll('_', ' ')}</span></div><div className="job-card-bottom"><div><b>{job.applications}</b><span>applications</span></div><div><b>{job.shortlisted}</b><span>shortlisted</span></div><div className="job-date">Opened {formatDate(job.createdAt)}</div><ArrowUpRight size={15} /></div></article>)}</div><aside className="pipeline-aside"><div className="eyebrow">At a glance</div><h2>Pipeline health</h2><p className="aside-copy">Your hiring motion is strongest where teams review evidence within 48 hours.</p><div className="pipeline-stat"><span>Open roles</span><b>{jobs.filter((job) => job.status === 'open').length}</b></div><div className="pipeline-stat"><span>Total applications</span><b>{jobs.reduce((sum, job) => sum + job.applications, 0)}</b></div><div className="pipeline-stat"><span>Shortlisted</span><b className="teal-number">{jobs.reduce((sum, job) => sum + job.shortlisted, 0)}</b></div><div className="mini-bars">{jobs.slice(0, 5).map((job) => <div key={job.id}><span>{job.title}</span><i><em style={{ width: `${Math.min(100, Math.max(12, job.applications ? (job.shortlisted / job.applications) * 100 * 4 : 12))}%` }} /></i></div>)}</div></aside></div>
    </DataState>
  </div>;
}

function Candidates() {
  const queryClient = useQueryClient();
  const candidatesQuery = useListCandidates({ query: { queryKey: getListCandidatesQueryKey() } });
  const jobsQuery = useListJobs({ query: { queryKey: getListJobsQueryKey() } });
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('all');
  const candidates = candidatesQuery.data ?? [];
  const jobs = jobsQuery.data ?? [];
  const filtered = useMemo(() => candidates.filter((candidate) => (stage === 'all' || candidate.status === stage) && `${candidate.name} ${candidate.role} ${candidate.skills.join(' ')}`.toLowerCase().includes(search.toLowerCase())), [candidates, search, stage]);
  const [evaluateOpen, setEvaluateOpen] = useState(false);
  const [evaluateCandidate, setEvaluateCandidate] = useState<Candidate | null>(null);
  const [evaluateJobId, setEvaluateJobId] = useState('');
  const [evaluationResult, setEvaluationResult] = useState<{ overallScore: number; skillsScore: number; experienceScore: number; educationScore: number; strengths: string[]; gaps: string[]; recommendation: string; summary: string } | null>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const evaluateMutation = useEvaluateCandidateForJob({
    mutation: {
      onSuccess: (data) => {
        setEvaluationResult(data);
        setEvaluationError(null);
      },
      onError: () => setEvaluationError('AI evaluation failed. Please try again.'),
    },
  });
  const openEvaluate = (candidate: Candidate) => {
    setEvaluateCandidate(candidate);
    setEvaluateJobId('');
    setEvaluationResult(null);
    setEvaluationError(null);
    setEvaluateOpen(true);
  };
  const submitEvaluate = () => {
    if (!evaluateCandidate || !evaluateJobId) return;
    setEvaluationError(null);
    setEvaluationResult(null);
    evaluateMutation.mutate({ candidateId: evaluateCandidate.id, jobId: evaluateJobId });
  };
  const recommendationLabel = evaluationResult?.recommendation === 'strong_match' ? 'Strong match' : evaluationResult?.recommendation === 'potential_match' ? 'Potential match' : evaluationResult?.recommendation === 'weak_match' ? 'Weak match' : '—';
  return <div className="page-content">
    <SectionHeader eyebrow="Signal review" title="Candidates" description="Review the evidence behind every candidate, not just a resume headline." action={<button className="button-primary" data-testid="button-invite-candidate" onClick={() => window.alert('Candidate invite flow is coming in the next workspace release.')}><Plus size={16} /> Invite candidate</button>} />
    <div className="candidate-summary"><div><span className="eyebrow">In your review queue</span><b>{filtered.length} candidates</b></div><div className="summary-divider" /><div><span className="eyebrow">High confidence</span><b>{candidates.filter((candidate) => candidate.matchScore >= 85).length} matches above 85%</b></div><div className="summary-spacer" /><div className="confidence-legend"><span><i className="legend-dot legend-teal" />Match score</span><span><i className="legend-dot legend-coral" />Interview signal</span></div></div>
    <div className="toolbar"><div className="search-box"><Search size={16} /><input data-testid="input-search-candidates" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search people, roles, or skills" /></div><div className="filter-group"><Filter size={15} /><select data-testid="select-candidate-stage" value={stage} onChange={(event) => setStage(event.target.value)}><option value="all">All stages</option><option value="new">New</option><option value="screening">Screening</option><option value="assessment">Assessment</option><option value="interview">Interview</option><option value="shortlisted">Shortlisted</option></select></div></div>
    <DataState loading={candidatesQuery.isLoading} error={candidatesQuery.isError} empty={!filtered.length} onRetry={() => candidatesQuery.refetch()}>
      <div className="candidate-table-wrap"><table className="candidate-table"><thead><tr><th>Candidate</th><th>Match</th><th>Technical</th><th>Interview</th><th>Stage</th><th>Applied</th><th /></tr></thead><tbody>{filtered.map((candidate) => <tr key={candidate.id} data-testid={`row-candidate-${candidate.id}`}><td><div className="candidate-cell"><span className="initial-avatar">{candidate.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><div><b>{candidate.name}</b><span>{candidate.role} · {candidate.location}</span><div className="skill-line">{candidate.skills.slice(0, 3).map((skill) => <em key={skill}>{skill}</em>)}</div></div></div></td><td><div className="score-wrap"><span className={`score score-${candidate.matchScore >= 85 ? 'high' : candidate.matchScore >= 70 ? 'mid' : 'low'}`}>{candidate.matchScore}%</span><i className="score-track"><em style={{ width: `${candidate.matchScore}%` }} /></i></div></td><td><span className="table-score">{candidate.technicalScore}%</span></td><td><span className="table-score">{candidate.interviewScore}%</span></td><td><StatusPill value={candidate.status} /></td><td className="date-cell">{formatDate(candidate.appliedAt)}</td><td><button className="more-button" data-testid={`button-candidate-menu-${candidate.id}`} onClick={() => window.alert(`Candidate profile: ${candidate.name}`)}><MoreHorizontal size={17} /></button><button className="button-secondary" data-testid={`button-evaluate-candidate-${candidate.id}`} onClick={() => openEvaluate(candidate)}><Brain size={15} /> Evaluate</button></td></tr>)}</tbody></table></div>
    </DataState>
    {evaluateOpen && <FormDialog title={evaluateCandidate ? `Evaluate ${evaluateCandidate.name}` : 'Evaluate candidate'} description="Select a job and run an AI fit evaluation." open={evaluateOpen} saving={evaluateMutation.isPending} error={evaluationError ?? null} onClose={() => setEvaluateOpen(false)}>
      <label>Job
        <select data-testid="select-evaluate-job" value={evaluateJobId} onChange={(event) => setEvaluateJobId(event.target.value)}>
          <option value="">Select a job</option>
          {jobs.map((job) => <option key={job.id} value={job.id}>{job.title} — {job.department}</option>)}
        </select>
      </label>
      {evaluationResult && <div className="evaluation-result">
        <div className="evaluation-scores">
          <div><b>{evaluationResult.overallScore}</b><span>Overall</span></div>
          <div><b>{evaluationResult.skillsScore}</b><span>Skills</span></div>
          <div><b>{evaluationResult.experienceScore}</b><span>Experience</span></div>
          <div><b>{evaluationResult.educationScore}</b><span>Education</span></div>
        </div>
        <div className="evaluation-recommendation"><StatusPill value={recommendationLabel.toLowerCase().replace(' ', '_')} /><span>{recommendationLabel}</span></div>
        <div className="evaluation-details">
          <div><b>Strengths</b>{evaluationResult.strengths.map((item) => <span key={item}>{item}</span>)}</div>
          <div><b>Gaps</b>{evaluationResult.gaps.map((item) => <span key={item}>{item}</span>)}</div>
          <p>{evaluationResult.summary}</p>
        </div>
      </div>}
      <div className="form-dialog-actions">
        <button type="button" className="button-secondary" onClick={() => setEvaluateOpen(false)}>Close</button>
        <button type="button" className="button-primary" disabled={evaluateMutation.isPending || !evaluateJobId} data-testid="button-run-evaluation" onClick={submitEvaluate}>{evaluateMutation.isPending ? 'Evaluating…' : 'Run evaluation'}</button>
      </div>
    </FormDialog>}
  </div>;
}

function Assessments() {
  const query = useListAssessments({ query: { queryKey: getListAssessmentsQueryKey() } });
  const assessments = query.data ?? [];
  return <div className="page-content"><SectionHeader eyebrow="Technical signal" title="Assessments" description="Build confidence in craft with consistent, role-specific evidence." action={<button className="button-primary" data-testid="button-new-assessment" onClick={() => window.alert('Assessment builder is coming in the next workspace release.')}><Plus size={16} /> New assessment</button>} /><DataState loading={query.isLoading} error={query.isError} empty={!assessments.length} onRetry={() => query.refetch()}><div className="assessment-grid">{assessments.map((assessment, index) => <article className={`assessment-card rise-in delay-${Math.min(index + 1, 3)}`} key={assessment.id} data-testid={`card-assessment-${assessment.id}`}><div className="assessment-top"><div className="assessment-symbol"><Code2 size={19} /></div><StatusPill value={assessment.status} /><button className="more-button" data-testid={`button-assessment-menu-${assessment.id}`} onClick={() => window.alert(`Actions for ${assessment.title}`)}><MoreHorizontal size={17} /></button></div><h2>{assessment.title}</h2><span className="assessment-role">{assessment.role}</span><div className="assessment-stats"><div><span>Submissions</span><b>{assessment.submissions}</b></div><div><span>Completion</span><b>{assessment.completionRate}%</b></div><div><span>Avg. score</span><b className="teal-number">{assessment.averageScore}%</b></div></div><div className="progress-track"><i style={{ width: `${assessment.completionRate}%` }} /></div><div className="assessment-footer"><span><Activity size={13} /> Evidence is current</span><ArrowUpRight size={15} /></div></article>)}</div></DataState></div>;
}

type KnowledgeSourceFormValues = {
  name: string;
  kind: 'policy' | 'job_description' | 'interview_guide' | 'technical_document';
  status: 'ready' | 'processing' | 'needs_review';
};

type AutomationFormValues = {
  name: string;
  trigger: string;
  status: 'active' | 'paused' | 'draft';
};

function FormDialog({ title, description, open, saving, error, onClose, children }: {
  title: string;
  description?: string;
  open: boolean;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="dialog-backdrop" onClick={() => { if (!saving) onClose(); }}>
      <div className="form-dialog" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="form-dialog-heading">
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button type="button" className="icon-button" aria-label="Close" onClick={onClose}><X size={18} /></button>
        </div>
        {error && <div className="form-error" data-testid="form-dialog-error"><CircleAlert size={15} />{error}</div>}
        <div className="form-dialog-fields">{children}</div>
      </div>
    </div>
  );
}

function KnowledgeSourceFormDialog({ open, saving, error, source, onClose, onSubmit }: {
  open: boolean;
  saving: boolean;
  error: string | null;
  source: { id: string; name: string; kind: KnowledgeSourceFormValues['kind']; status: KnowledgeSourceFormValues['status'] } | null;
  onClose: () => void;
  onSubmit: (values: KnowledgeSourceFormValues) => void;
}) {
  const [name, setName] = useState(source?.name ?? '');
  const [kind, setKind] = useState<KnowledgeSourceFormValues['kind']>(source?.kind ?? 'policy');
  const [status, setStatus] = useState<KnowledgeSourceFormValues['status']>(source?.status ?? 'ready');

  useEffect(() => {
    setName(source?.name ?? '');
    setKind(source?.kind ?? 'policy');
    setStatus(source?.status ?? 'ready');
  }, [source, open]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({ name, kind, status });
  };

  return (
    <FormDialog
      title={source ? 'Edit source' : 'Add source'}
      description="Give this knowledge source a name and tell TalentOS how to treat it."
      open={open}
      saving={saving}
      error={error}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <label>Name
          <input data-testid="input-source-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Engineering hiring policy" />
        </label>
        <div className="form-grid">
          <label>Kind
            <select data-testid="select-source-kind" value={kind} onChange={(event) => setKind(event.target.value as KnowledgeSourceFormValues['kind'])}>
              <option value="policy">Policy</option>
              <option value="job_description">Job description</option>
              <option value="interview_guide">Interview guide</option>
              <option value="technical_document">Technical document</option>
            </select>
          </label>
          <label>Status
            <select data-testid="select-source-status" value={status} onChange={(event) => setStatus(event.target.value as KnowledgeSourceFormValues['status'])}>
              <option value="ready">Ready</option>
              <option value="processing">Processing</option>
              <option value="needs_review">Needs review</option>
            </select>
          </label>
        </div>
        <div className="form-dialog-actions">
          <button type="button" className="button-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="button-primary" disabled={saving} data-testid="button-save-source">{saving ? 'Saving…' : 'Save source'}</button>
        </div>
      </form>
    </FormDialog>
  );
}

function AutomationFormDialog({ open, saving, error, automation, onClose, onSubmit }: {
  open: boolean;
  saving: boolean;
  error: string | null;
  automation: { id: string; name: string; trigger: string; status: AutomationFormValues['status'] } | null;
  onClose: () => void;
  onSubmit: (values: AutomationFormValues) => void;
}) {
  const [name, setName] = useState(automation?.name ?? '');
  const [trigger, setTrigger] = useState(automation?.trigger ?? '');
  const [status, setStatus] = useState<AutomationFormValues['status']>(automation?.status ?? 'active');

  useEffect(() => {
    setName(automation?.name ?? '');
    setTrigger(automation?.trigger ?? '');
    setStatus(automation?.status ?? 'active');
  }, [automation, open]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({ name, trigger, status });
  };

  return (
    <FormDialog
      title={automation ? 'Edit automation' : 'Add automation'}
      description="Name the workflow and describe what kicks it off."
      open={open}
      saving={saving}
      error={error}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <label>Name
          <input data-testid="input-automation-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Triage new applicants" />
        </label>
        <label>Trigger
          <input data-testid="input-automation-trigger" value={trigger} onChange={(event) => setTrigger(event.target.value)} placeholder="e.g. a candidate applies" />
        </label>
        <label>Status
          <select data-testid="select-automation-status" value={status} onChange={(event) => setStatus(event.target.value as AutomationFormValues['status'])}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="draft">Draft</option>
          </select>
        </label>
        <div className="form-dialog-actions">
          <button type="button" className="button-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="button-primary" disabled={saving} data-testid="button-save-automation">{saving ? 'Saving…' : 'Save automation'}</button>
        </div>
      </form>
    </FormDialog>
  );
}

function Knowledge() {
  const queryClient = useQueryClient();
  const query = useListKnowledgeSources({ query: { queryKey: getListKnowledgeSourcesQueryKey() } });
  const sources = query.data ?? [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<{ id: string; name: string; kind: KnowledgeSourceFormValues['kind']; status: KnowledgeSourceFormValues['status'] } | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantAnswer, setAssistantAnswer] = useState<{ answer: string; sources: { id: string; name: string; kind: string }[] } | null>(null);
  const [assistantError, setAssistantError] = useState<string | null>(null);

  const queryKnowledge = useQueryKnowledge({
    mutation: {
      onSuccess: (data) => {
        setAssistantAnswer(data);
        setAssistantError(null);
      },
      onError: () => setAssistantError('Knowledge query failed. Please try again.'),
    },
  });

  const createMutation = useCreateKnowledgeSource({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListKnowledgeSourcesQueryKey() });
        setDialogOpen(false);
        setEditingSource(null);
        setMutationError(null);
      },
      onError: (error) => setMutationError(error instanceof Error ? error.message : 'Could not save the source.'),
    },
  });

  const updateMutation = useUpdateKnowledgeSource({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListKnowledgeSourcesQueryKey() });
        setDialogOpen(false);
        setEditingSource(null);
        setMutationError(null);
      },
      onError: (error) => setMutationError(error instanceof Error ? error.message : 'Could not save the source.'),
    },
  });

  const deleteMutation = useDeleteKnowledgeSource({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListKnowledgeSourcesQueryKey() });
        setMutationError(null);
      },
      onError: (error) => setMutationError(error instanceof Error ? error.message : 'Could not delete the source.'),
    },
  });

  const saving = createMutation.isPending || updateMutation.isPending;

  const openCreate = () => {
    setEditingSource(null);
    setMutationError(null);
    setDialogOpen(true);
  };

  const openEdit = (source: { id: string; name: string; kind: KnowledgeSourceFormValues['kind']; status: KnowledgeSourceFormValues['status'] }) => {
    setEditingSource(source);
    setMutationError(null);
    setDialogOpen(true);
  };

  const submitSource = (values: KnowledgeSourceFormValues) => {
    setMutationError(null);
    if (editingSource) {
      updateMutation.mutate({ sourceId: editingSource.id, data: values });
    } else {
      createMutation.mutate({ data: values });
    }
  };

  const removeSource = (source: { id: string; name: string }) => {
    if (!window.confirm(`Delete "${source.name}"? This cannot be undone.`)) return;
    deleteMutation.mutate({ sourceId: source.id });
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setMutationError(null);
  };

  return <div className="page-content"><SectionHeader eyebrow="Ground truth" title="Knowledge" description="The sources TalentOS can use to keep screening and interview decisions anchored." action={<button className="button-primary" data-testid="button-add-source" onClick={openCreate}><Plus size={16} /> Add source</button>} /><div className="knowledge-hero"><div className="knowledge-orbit"><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-core"><Sparkles size={23} /></div></div><div><span className="eyebrow">Retrieval readiness</span><h2>Your hiring context, in one place.</h2><p>Policies, role briefs, and interview guides become a shared point of reference for every evaluator.</p></div><div className="knowledge-total"><b>{sources.reduce((sum, source) => sum + source.chunks, 0).toLocaleString()}</b><span>indexed chunks</span></div></div><DataState loading={query.isLoading} error={query.isError} empty={!sources.length} onRetry={() => query.refetch()}><div className="source-list">{sources.map((source) => <div className="source-row" key={source.id} data-testid={`row-source-${source.id}`}><div className={`source-icon source-${source.kind}`}><FileText size={18} /></div><div className="source-name"><b>{source.name}</b><span>{source.kind.replaceAll('_', ' ')} · {source.chunks} chunks</span></div><StatusPill value={source.status} /><div className="source-updated">Updated {formatDate(source.updatedAt)}</div><button className="icon-button" data-testid={`button-source-edit-${source.id}`} aria-label={`Edit ${source.name}`} onClick={() => openEdit({ id: source.id, name: source.name, kind: source.kind, status: source.status })}><Pencil size={16} /></button><button className="icon-button" data-testid={`button-source-delete-${source.id}`} aria-label={`Delete ${source.name}`} onClick={() => removeSource({ id: source.id, name: source.name })}><Trash2 size={16} /></button></div>)}</div></DataState><KnowledgeSourceFormDialog open={dialogOpen} saving={saving} error={mutationError} source={editingSource} onClose={closeDialog} onSubmit={submitSource} /><div className="knowledge-assistant"><div className="assistant-heading"><Brain size={18} /><div><b>Knowledge assistant</b><span>Ask a question grounded in your hiring context.</span></div></div><form className="assistant-form" onSubmit={(event) => { event.preventDefault(); if (!assistantQuery.trim()) return; setAssistantError(null); setAssistantAnswer(null); queryKnowledge.mutate({ data: { query: assistantQuery } }); }}><input data-testid="input-knowledge-query" value={assistantQuery} onChange={(event) => setAssistantQuery(event.target.value)} placeholder="Ask about interview policy, role requirements, or hiring standards..." /><button type="submit" className="button-primary" disabled={queryKnowledge.isPending}>{queryKnowledge.isPending ? 'Searching…' : 'Ask'}</button></form>{assistantAnswer && <div className="assistant-result"><p>{assistantAnswer.answer}</p><div className="assistant-sources">{assistantAnswer.sources.map((source) => <span key={source.id} className="assistant-source-chip">{source.name}</span>)}</div></div>}{assistantError && <div className="form-error" data-testid="form-dialog-error"><CircleAlert size={15} />{assistantError}</div>}</div></div>;
}

function Automations() {
  const queryClient = useQueryClient();
  const query = useListAutomations({ query: { queryKey: getListAutomationsQueryKey() } });
  const automations = query.data ?? [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<{ id: string; name: string; trigger: string; status: AutomationFormValues['status'] } | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const createMutation = useCreateAutomation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAutomationsQueryKey() });
        setDialogOpen(false);
        setEditingAutomation(null);
        setMutationError(null);
      },
      onError: (error) => setMutationError(error instanceof Error ? error.message : 'Could not save the automation.'),
    },
  });

  const updateMutation = useUpdateAutomation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAutomationsQueryKey() });
        setDialogOpen(false);
        setEditingAutomation(null);
        setMutationError(null);
      },
      onError: (error) => setMutationError(error instanceof Error ? error.message : 'Could not save the automation.'),
    },
  });

  const deleteMutation = useDeleteAutomation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAutomationsQueryKey() });
        setMutationError(null);
      },
      onError: (error) => setMutationError(error instanceof Error ? error.message : 'Could not delete the automation.'),
    },
  });

  const saving = createMutation.isPending || updateMutation.isPending;

  const openCreate = () => {
    setEditingAutomation(null);
    setMutationError(null);
    setDialogOpen(true);
  };

  const openEdit = (automation: { id: string; name: string; trigger: string; status: AutomationFormValues['status'] }) => {
    setEditingAutomation(automation);
    setMutationError(null);
    setDialogOpen(true);
  };

  const submitAutomation = (values: AutomationFormValues) => {
    setMutationError(null);
    if (editingAutomation) {
      updateMutation.mutate({ automationId: editingAutomation.id, data: values });
    } else {
      createMutation.mutate({ data: values });
    }
  };

  const removeAutomation = (automation: { id: string; name: string }) => {
    if (!window.confirm(`Delete "${automation.name}"? This cannot be undone.`)) return;
    deleteMutation.mutate({ automationId: automation.id });
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setMutationError(null);
  };

  return <div className="page-content"><SectionHeader eyebrow="Quiet leverage" title="Automations" description="Review the workflows that keep candidate movement timely and consistent." action={<button className="button-primary" data-testid="button-new-automation" onClick={openCreate}><Plus size={16} /> New automation</button>} /><div className="automation-callout"><div className="automation-callout-icon"><Zap size={21} /></div><div><b>Automation should feel invisible.</b><span>TalentOS is watching the handoffs so your team can stay present for the decisions.</span></div><div className="callout-stat"><b>{automations.filter((automation) => automation.status === 'active').length}</b><span>active workflows</span></div></div><DataState loading={query.isLoading} error={query.isError} empty={!automations.length} onRetry={() => query.refetch()}><div className="automation-list">{automations.map((automation) => <div className="automation-row" key={automation.id} data-testid={`row-automation-${automation.id}`}><div className="automation-flow"><span className="flow-node"><CircleDot size={15} /></span><i /><span className="flow-node"><ArrowRight size={14} /></span></div><div className="automation-name"><b>{automation.name}</b><span>When {automation.trigger}</span></div><div className="automation-steps"><b>{automation.steps}</b><span>steps</span></div><div className="automation-runs"><b>{automation.runsThisMonth}</b><span>runs this month</span></div><StatusPill value={automation.status} /><button className="icon-button" data-testid={`button-automation-edit-${automation.id}`} aria-label={`Edit ${automation.name}`} onClick={() => openEdit({ id: automation.id, name: automation.name, trigger: automation.trigger, status: automation.status })}><Pencil size={16} /></button><button className="icon-button" data-testid={`button-automation-delete-${automation.id}`} aria-label={`Delete ${automation.name}`} onClick={() => removeAutomation({ id: automation.id, name: automation.name })}><Trash2 size={16} /></button></div>)}</div></DataState><AutomationFormDialog open={dialogOpen} saving={saving} error={mutationError} automation={editingAutomation} onClose={closeDialog} onSubmit={submitAutomation} /></div>;
}

function Analytics() {
  const query = useGetAnalyticsFunnel({ query: { queryKey: getGetAnalyticsFunnelQueryKey() } });
  const stages = query.data ?? [];
  const max = Math.max(...stages.map((stage) => stage.count), 1);
  return <div className="page-content"><SectionHeader eyebrow="Evidence, at scale" title="Analytics" description="See where application energy becomes meaningful hiring signal." action={<button className="button-secondary" data-testid="button-export-analytics" onClick={() => window.alert('Analytics export is coming in the next workspace release.')}><ExternalLink size={15} /> Export view</button>} /><DataState loading={query.isLoading} error={query.isError} empty={!stages.length} onRetry={() => query.refetch()}><div className="analytics-grid"><section className="panel funnel-panel"><div className="panel-heading"><div><div className="eyebrow">Application funnel</div><h2>From interest to signal</h2></div><button className="icon-button subtle" data-testid="button-funnel-options" onClick={() => window.alert('Funnel options are coming in the next workspace release.')}><MoreHorizontal size={18} /></button></div><div className="funnel-chart">{stages.map((stage, index) => <div className="funnel-stage" key={stage.label} data-testid={`funnel-stage-${index}`}><div className="funnel-label"><span>{stage.label}</span><b>{stage.count.toLocaleString()}</b></div><div className="funnel-bar-track"><i style={{ width: `${Math.max(8, (stage.count / max) * 100)}%`, opacity: 1 - index * 0.1 }} /></div><span className="conversion">{stage.conversionRate}% <small>conversion</small></span></div>)}</div></section><aside className="analytics-side"><div className="panel signal-panel"><div className="eyebrow">Decision signal</div><h2>The drop-off is early.</h2><p>Most candidates leave before the first screen. Sharpening role context here will have the highest leverage.</p><div className="signal-number">{stages[0]?.conversionRate ?? 0}<span>%</span></div><span className="signal-caption">first-stage conversion</span><Link href="/jobs" className="text-link" data-testid="link-analytics-jobs">Review open roles <ArrowRight size={14} /></Link></div><div className="panel benchmark-panel"><div className="eyebrow">Workspace rhythm</div><div className="benchmark-row"><span>Time to shortlist</span><b>6.4 days</b></div><div className="benchmark-row"><span>Assessment completion</span><b>71%</b></div><div className="benchmark-row"><span>Interview feedback</span><b className="teal-number">92%</b></div></div></aside></div></DataState></div>;
}

function Settings() {
  return <div className="page-content"><SectionHeader eyebrow="Workspace admin" title="Settings" description="The foundations of your hiring workspace live here." /><div className="settings-placeholder"><div className="settings-illustration"><LockKeyhole size={31} /></div><div><h2>Configuration is taking shape.</h2><p>Workspace preferences, hiring permissions, and integrations will be available here as the TalentOS foundation expands.</p><button className="button-secondary" data-testid="button-settings-contact" onClick={() => window.alert('Your TalentOS partner has been notified.')}>Talk to your TalentOS partner <ArrowRight size={15} /></button></div></div><div className="settings-sections"><div><span className="eyebrow">Coming next</span><b>Workspace profile</b><span>Brand, timezone, and default hiring preferences.</span></div><div><span className="eyebrow">Coming next</span><b>Team access</b><span>Roles and permissions for every evaluator.</span></div><div><span className="eyebrow">Coming next</span><b>Integrations</b><span>Connect the tools your team already trusts.</span></div></div></div>;
}

function Router() {
  return <Shell><ErrorBoundary><Switch><Route path="/" component={Overview} /><Route path="/jobs" component={Jobs} /><Route path="/candidates" component={Candidates} /><Route path="/assessments" component={Assessments} /><Route path="/knowledge" component={Knowledge} /><Route path="/automations" component={Automations} /><Route path="/analytics" component={Analytics} /><Route path="/settings" component={Settings} /><Route component={NotFound} /></Switch></ErrorBoundary></Shell>;
}

function Landing() {
  return (
    <div className="auth-landing noise">
      <div className="auth-landing-orb" />
      <div className="auth-landing-inner">
        <div className="brand-lockup auth-brand"><span className="brand-mark"><span /></span><span><strong>TalentOS</strong><small>Hiring intelligence</small></span></div>
        <div className="auth-landing-grid">
          <div>
            <div className="eyebrow">High-signal hiring</div>
            <h1 className="auth-landing-title">Turn applicant volume into <span className="serif-accent">clear decisions.</span></h1>
            <p className="auth-landing-copy">TalentOS brings roles, evidence, technical assessment, and recruiter judgment into one calm command center.</p>
            <div className="auth-landing-actions">
              <Link href="/sign-up" className="button-primary">Create workspace <ArrowRight size={16} /></Link>
              <Link href="/sign-in" className="button-secondary">Sign in</Link>
            </div>
          </div>
          <div className="auth-landing-card">
            <div className="eyebrow">Your hiring signal</div>
            <div className="auth-signal-score">82<span>%</span></div>
            <div className="auth-signal-label">average match confidence</div>
            <div className="auth-signal-row"><span><i className="legend-dot legend-teal" />Evidence-backed screening</span><b>94%</b></div>
            <div className="auth-signal-row"><span><i className="legend-dot legend-coral" />Technical signal captured</span><b>84%</b></div>
            <div className="auth-signal-row"><span><i className="legend-dot legend-amber" />Teams aligned on next steps</span><b>76%</b></div>
          </div>
        </div>
        <div className="auth-landing-foot"><span>Built for modern hiring teams</span><span>Protected workspace access</span><span>Explainable by design</span></div>
      </div>
    </div>
  );
}

function SignInPage() {
  return <div className="auth-page"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>;
}

function SignUpPage() {
  return <div className="auth-page"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (previousUserId.current !== undefined && previousUserId.current !== userId) client.clear();
      previousUserId.current = userId;
    });
    return unsubscribe;
  }, [addListener, client]);

  return null;
}

function ProtectedRouter() {
  return (
    <>
      <Show when="signed-in"><Router /></Show>
      <Show when="signed-out"><Redirect to="/" /></Show>
    </>
  );
}

function ClerkRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to access your hiring workspace' } },
        signUp: { start: { title: 'Create your workspace', subtitle: 'Start making hiring decisions with more signal' } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/" component={() => <><Show when="signed-in"><Router /></Show><Show when="signed-out"><Landing /></Show></>} />
          <Route component={ProtectedRouter} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return <TooltipProvider><WouterRouter base={basePath}><ClerkRoutes /></WouterRouter><Toaster /></TooltipProvider>;
}

export default App;