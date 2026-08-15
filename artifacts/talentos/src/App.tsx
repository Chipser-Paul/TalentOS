import { useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  UsersRound,
  Workflow,
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
  useListAssessments,
  useListAutomations,
  useListCandidates,
  useListJobs,
  useListKnowledgeSources,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Link, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

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
            <span className="profile-avatar">AM</span>
            <span><b>Alex Morgan</b><small>Talent partner</small></span>
            <MoreHorizontal size={17} className="ml-auto text-sidebar-foreground/50" />
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
  const query = useListCandidates({ query: { queryKey: getListCandidatesQueryKey() } });
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('all');
  const candidates = query.data ?? [];
  const filtered = useMemo(() => candidates.filter((candidate) => (stage === 'all' || candidate.status === stage) && `${candidate.name} ${candidate.role} ${candidate.skills.join(' ')}`.toLowerCase().includes(search.toLowerCase())), [candidates, search, stage]);
  return <div className="page-content">
    <SectionHeader eyebrow="Signal review" title="Candidates" description="Review the evidence behind every candidate, not just a resume headline." action={<button className="button-primary" data-testid="button-invite-candidate" onClick={() => window.alert('Candidate invite flow is coming in the next workspace release.')}><Plus size={16} /> Invite candidate</button>} />
    <div className="candidate-summary"><div><span className="eyebrow">In your review queue</span><b>{filtered.length} candidates</b></div><div className="summary-divider" /><div><span className="eyebrow">High confidence</span><b>{candidates.filter((candidate) => candidate.matchScore >= 85).length} matches above 85%</b></div><div className="summary-spacer" /><div className="confidence-legend"><span><i className="legend-dot legend-teal" />Match score</span><span><i className="legend-dot legend-coral" />Interview signal</span></div></div>
    <div className="toolbar"><div className="search-box"><Search size={16} /><input data-testid="input-search-candidates" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search people, roles, or skills" /></div><div className="filter-group"><Filter size={15} /><select data-testid="select-candidate-stage" value={stage} onChange={(event) => setStage(event.target.value)}><option value="all">All stages</option><option value="new">New</option><option value="screening">Screening</option><option value="assessment">Assessment</option><option value="interview">Interview</option><option value="shortlisted">Shortlisted</option></select></div></div>
    <DataState loading={query.isLoading} error={query.isError} empty={!filtered.length} onRetry={() => query.refetch()}>
      <div className="candidate-table-wrap"><table className="candidate-table"><thead><tr><th>Candidate</th><th>Match</th><th>Technical</th><th>Interview</th><th>Stage</th><th>Applied</th><th /></tr></thead><tbody>{filtered.map((candidate) => <tr key={candidate.id} data-testid={`row-candidate-${candidate.id}`}><td><div className="candidate-cell"><span className="initial-avatar">{candidate.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><div><b>{candidate.name}</b><span>{candidate.role} · {candidate.location}</span><div className="skill-line">{candidate.skills.slice(0, 3).map((skill) => <em key={skill}>{skill}</em>)}</div></div></div></td><td><div className="score-wrap"><span className={`score score-${candidate.matchScore >= 85 ? 'high' : candidate.matchScore >= 70 ? 'mid' : 'low'}`}>{candidate.matchScore}%</span><i className="score-track"><em style={{ width: `${candidate.matchScore}%` }} /></i></div></td><td><span className="table-score">{candidate.technicalScore}%</span></td><td><span className="table-score">{candidate.interviewScore}%</span></td><td><StatusPill value={candidate.status} /></td><td className="date-cell">{formatDate(candidate.appliedAt)}</td><td><button className="more-button" data-testid={`button-candidate-menu-${candidate.id}`} onClick={() => window.alert(`Candidate profile: ${candidate.name}`)}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div>
    </DataState>
  </div>;
}

function Assessments() {
  const query = useListAssessments({ query: { queryKey: getListAssessmentsQueryKey() } });
  const assessments = query.data ?? [];
  return <div className="page-content"><SectionHeader eyebrow="Technical signal" title="Assessments" description="Build confidence in craft with consistent, role-specific evidence." action={<button className="button-primary" data-testid="button-new-assessment" onClick={() => window.alert('Assessment builder is coming in the next workspace release.')}><Plus size={16} /> New assessment</button>} /><DataState loading={query.isLoading} error={query.isError} empty={!assessments.length} onRetry={() => query.refetch()}><div className="assessment-grid">{assessments.map((assessment, index) => <article className={`assessment-card rise-in delay-${Math.min(index + 1, 3)}`} key={assessment.id} data-testid={`card-assessment-${assessment.id}`}><div className="assessment-top"><div className="assessment-symbol"><Code2 size={19} /></div><StatusPill value={assessment.status} /><button className="more-button" data-testid={`button-assessment-menu-${assessment.id}`} onClick={() => window.alert(`Actions for ${assessment.title}`)}><MoreHorizontal size={17} /></button></div><h2>{assessment.title}</h2><span className="assessment-role">{assessment.role}</span><div className="assessment-stats"><div><span>Submissions</span><b>{assessment.submissions}</b></div><div><span>Completion</span><b>{assessment.completionRate}%</b></div><div><span>Avg. score</span><b className="teal-number">{assessment.averageScore}%</b></div></div><div className="progress-track"><i style={{ width: `${assessment.completionRate}%` }} /></div><div className="assessment-footer"><span><Activity size={13} /> Evidence is current</span><ArrowUpRight size={15} /></div></article>)}</div></DataState></div>;
}

function Knowledge() {
  const query = useListKnowledgeSources({ query: { queryKey: getListKnowledgeSourcesQueryKey() } });
  const sources = query.data ?? [];
  return <div className="page-content"><SectionHeader eyebrow="Ground truth" title="Knowledge" description="The sources TalentOS can use to keep screening and interview decisions anchored." action={<button className="button-primary" data-testid="button-add-source" onClick={() => window.alert('Source upload is coming in the next workspace release.')}><Plus size={16} /> Add source</button>} /><div className="knowledge-hero"><div className="knowledge-orbit"><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-core"><Sparkles size={23} /></div></div><div><span className="eyebrow">Retrieval readiness</span><h2>Your hiring context, in one place.</h2><p>Policies, role briefs, and interview guides become a shared point of reference for every evaluator.</p></div><div className="knowledge-total"><b>{sources.reduce((sum, source) => sum + source.chunks, 0).toLocaleString()}</b><span>indexed chunks</span></div></div><DataState loading={query.isLoading} error={query.isError} empty={!sources.length} onRetry={() => query.refetch()}><div className="source-list">{sources.map((source) => <div className="source-row" key={source.id} data-testid={`row-source-${source.id}`}><div className={`source-icon source-${source.kind}`}><FileText size={18} /></div><div className="source-name"><b>{source.name}</b><span>{source.kind.replaceAll('_', ' ')} · {source.chunks} chunks</span></div><StatusPill value={source.status} /><div className="source-updated">Updated {formatDate(source.updatedAt)}</div><button className="more-button" data-testid={`button-source-menu-${source.id}`} onClick={() => window.alert(`Actions for ${source.name}`)}><MoreHorizontal size={17} /></button></div>)}</div></DataState></div>;
}

function Automations() {
  const query = useListAutomations({ query: { queryKey: getListAutomationsQueryKey() } });
  const automations = query.data ?? [];
  return <div className="page-content"><SectionHeader eyebrow="Quiet leverage" title="Automations" description="Review the workflows that keep candidate movement timely and consistent." action={<button className="button-primary" data-testid="button-new-automation" onClick={() => window.alert('Automation builder is coming in the next workspace release.')}><Plus size={16} /> New automation</button>} /><div className="automation-callout"><div className="automation-callout-icon"><Zap size={21} /></div><div><b>Automation should feel invisible.</b><span>TalentOS is watching the handoffs so your team can stay present for the decisions.</span></div><div className="callout-stat"><b>{automations.filter((automation) => automation.status === 'active').length}</b><span>active workflows</span></div></div><DataState loading={query.isLoading} error={query.isError} empty={!automations.length} onRetry={() => query.refetch()}><div className="automation-list">{automations.map((automation) => <div className="automation-row" key={automation.id} data-testid={`row-automation-${automation.id}`}><div className="automation-flow"><span className="flow-node"><CircleDot size={15} /></span><i /><span className="flow-node"><ArrowRight size={14} /></span></div><div className="automation-name"><b>{automation.name}</b><span>When {automation.trigger}</span></div><div className="automation-steps"><b>{automation.steps}</b><span>steps</span></div><div className="automation-runs"><b>{automation.runsThisMonth}</b><span>runs this month</span></div><StatusPill value={automation.status} /><button className="more-button" data-testid={`button-automation-menu-${automation.id}`} onClick={() => window.alert(`Actions for ${automation.name}`)}><MoreHorizontal size={17} /></button></div>)}</div></DataState></div>;
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

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;