'use client'

import { useState } from 'react'
import styles from './landing.module.css'
import {
  ArrowRight,
  BarChart3,
  Check,
    CloudOff,
  Gauge,
  KeyRound,
  LayoutGrid,
  LineChart,
  Puzzle,
  Rocket,
  Search,
  Settings2,
  Sparkles,
  Users,
  Zap,
  Moon,
  Sun,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const features = [
  { icon: CloudOff, title: 'Keep setup with your administrator', body: 'Your administrator handles the one-time Google setup. You choose the accounts, services and assets to use.', tone: 'rose' },
  { icon: Puzzle, title: 'Choose the accounts you work with', body: 'Bring GA4 properties, Tag Manager containers, Search Console sites and BigQuery datasets into one access view.', tone: 'teal' },
  { icon: LineChart, title: 'Find the information you need', body: 'The pilot is being built for tasks such as reading GA4 reports, checking Search Console data and inspecting BigQuery tables through your agent.', tone: 'blue' },
  { icon: Zap, title: 'Decide what your agent can change', body: 'Enable specific tools and resources. Supported changes need separate write permission; connecting an account is not blanket access.', tone: 'violet' },
]

const steps = [
  { number: '1', title: 'Connect your account', body: 'After administrator setup, approve the Google services you need.', icon: KeyRound },
  { number: '2', title: 'Choose your tools', body: 'Select the accounts, assets and tasks your agent may use.', icon: LayoutGrid },
  { number: '3', title: 'Put your agent to work', body: 'Test a supported task with your approved access. Hosted execution is still being verified.', icon: Rocket },
]

function Logo() {
  return <div className="flex items-center gap-2 text-xl font-bold tracking-tight"><span>gog-marketing</span><span className="text-blue-400">⌁</span></div>
}

function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[640px] [transform:perspective(1100px)_rotateY(-6deg)_rotateX(2deg)]">
      <div className="rounded-[18px] border border-slate-500/80 bg-[#070e1d] p-2 shadow-[0_30px_80px_rgba(0,0,0,.55)]">
        <div className="flex min-h-[330px] overflow-hidden rounded-xl border border-white/10 bg-[#0b1528] text-[10px] text-slate-300 sm:min-h-[390px] sm:text-xs">
          <aside className="hidden w-32 shrink-0 border-r border-white/10 bg-[#0a1324] p-4 sm:block">
            <div className="mb-6 text-[11px] font-bold text-white">gog-marketing<span className="text-blue-400">⌁</span></div>
            <div className="flex flex-col gap-3 text-slate-400"><div className="rounded-lg bg-blue-500/20 px-2 py-2 text-blue-300">⌂ &nbsp; Home</div><div>♙ &nbsp; Accounts</div><div>♧ &nbsp; Services</div><div>◇ &nbsp; Assets</div><div>⚙ &nbsp; Tool access</div><div>◌ &nbsp; Settings</div></div>
          </aside>
          <div className="min-w-0 flex-1 p-4 sm:p-5">
            <div className="flex items-start justify-between"><div><h3 className="text-base font-semibold text-white sm:text-lg">Your Google tool access</h3><p className="text-[9px] text-slate-500 sm:text-[10px]">Illustrative access view. Not a performance dashboard.</p></div><Button size="sm" className="h-7 rounded-full bg-blue-600 px-3 text-[10px]">+ Connect account</Button></div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2"><MockPanel title="Connected accounts"><div className="flex items-center gap-2"><div className="grid size-6 place-items-center rounded-full bg-slate-700">◉</div><div><p className="text-white">Brand Account A</p><p className="text-[9px] text-emerald-400">● Connected</p></div></div><div className="mt-3 flex items-center gap-2"><div className="grid size-6 place-items-center rounded-full bg-blue-600/40">◉</div><div><p className="text-white">Brand Account B</p><p className="text-[9px] text-rose-400">● Needs attention</p></div></div></MockPanel><MockPanel title="Your services"><Service icon={<LineChart />} name="Tag Manager" /><Service icon={<BarChart3 />} name="Google Analytics" /><Service icon={<Search />} name="Search Console" /><Service icon={<LayoutGrid />} name="BigQuery" /></MockPanel></div>
            <p className="mt-4 font-semibold text-white">Choose approved resources</p><div className="mt-2 grid gap-2 sm:grid-cols-3"><Workflow icon={<Rocket />} title="GTM containers" /><Workflow icon={<BarChart3 />} title="GA4 properties" /><Workflow icon={<Search />} title="Search Console sites" /></div>
          </div>
        </div>
      </div>
    </div>
  )
}
function MockPanel({ title, children }: { title: string; children: React.ReactNode }) { return <div className="rounded-lg border border-white/10 bg-white/[.04] p-3"><p className="mb-3 font-semibold text-white">{title}</p>{children}</div> }
function Service({ icon, name }: { icon: React.ReactNode; name: string }) { return <div className="flex items-center gap-2 py-1.5"><span className="text-blue-400 [&>svg]:size-4">{icon}</span><span>{name}</span><span className="ml-auto text-emerald-400">●</span></div> }
function Workflow({ icon, title }: { icon: React.ReactNode; title: string }) { return <div className="rounded-lg border border-white/10 bg-[#101c32] p-3"><span className="text-blue-400 [&>svg]:size-5">{icon}</span><p className="mt-2 font-semibold text-white">{title}</p><p className="mt-1 text-[9px] text-slate-400">Choose what your agent may access.</p></div> }

function SectionHeading({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <h2 className={`text-3xl font-bold tracking-tight text-white sm:text-4xl ${className}`}>{children}</h2> }

export default function GogMarketingLanding() {
  const [isLight, setIsLight] = useState(false)

  return <div className={`${styles.landing} min-h-screen overflow-hidden bg-[#050b18] text-slate-200 ${isLight ? 'light-theme' : ''}`}>
    <section className="relative isolate"><div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_20%,rgba(44,87,180,.28),transparent_34%),linear-gradient(120deg,#071124_0%,#050b18_65%)]" /><div className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-16 pt-8 lg:grid-cols-[.92fr_1.08fr] lg:px-10 lg:pb-24 lg:pt-10"><div><div className="flex items-center justify-between gap-4"><Logo /><button type="button" onClick={() => setIsLight((value) => !value)} className="inline-flex items-center gap-2 rounded-full border border-blue-400/40 bg-white/5 px-3 py-2 text-xs font-semibold text-blue-200 transition hover:bg-white/10" aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}><span>{isLight ? 'Dark mode' : 'Light mode'}</span>{isLight ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}</button></div><p className="mt-14 inline-flex items-center gap-3 rounded-full border border-blue-500/50 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300"><Users className="size-5" /> Google marketing tools, with access you control</p><h1 className="mt-6 max-w-xl text-5xl font-bold leading-[1.03] tracking-[-.04em] text-white sm:text-6xl">Your Google marketing tools. <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-fuchsia-500 bg-clip-text text-transparent">One place to get things done.</span></h1><p className="mt-7 max-w-lg text-lg leading-7 text-slate-300">Connect Google Analytics, Tag Manager, Search Console and BigQuery to your agents. Choose the accounts and tools they can use to read reports and carry out supported tasks.</p><Button asChild size="lg" className="mt-7 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-8 text-base font-semibold"><a href="https://github.com/Rajeev-SG/gog-marketing#getting-started">Read the setup guide <ArrowRight /></a></Button><p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">Private pilot. Hosted tasks are still being verified. Your administrator handles Google Cloud setup; you do not manage API credentials yourself.</p></div><DashboardMockup /></div></section>
    <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10"><SectionHeading>Do more with the tools you already use</SectionHeading><div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{features.map(({ icon: Icon, title, body, tone }) => <article key={title} className={`feature-card ${tone}`}><Icon className="size-10" /><h3 className="mt-5 text-xl font-semibold text-white">{title}</h3><p className="mt-3 leading-6 text-slate-300">{body}</p></article>)}</div></section>
    <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10"><SectionHeading>Inside the private-pilot workflow</SectionHeading><div className="mt-8 grid gap-10 lg:grid-cols-3">{steps.map(({ number, title, body, icon: Icon }) => <article key={number} className="relative"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-400 to-blue-700 text-xl font-bold text-white shadow-lg shadow-blue-900/60">{number}</span><div><h3 className="text-xl font-semibold text-white">{title}</h3><p className="mt-1 max-w-xs text-slate-300">{body}</p></div></div><div className="mt-5 flex min-h-36 items-center justify-center rounded-2xl border border-blue-400/40 bg-[#0c172b] p-5 shadow-[0_0_40px_rgba(30,92,220,.12)]"><Icon className="size-12 text-blue-400" /><div className="ml-4 rounded-lg border border-white/10 bg-[#111d32] p-4 text-sm"><p className="font-semibold text-white">{number === '1' ? 'Approve Google access' : number === '2' ? 'Select tools and resources' : 'Run an approved task'}</p><div className="mt-3 flex flex-col gap-2 text-slate-300">{['Account connected', 'Tools and resources selected', 'Agent access approved'].slice(0, number === '3' ? 3 : 2).map((item) => <span key={item} className="flex items-center gap-2"><Check className="size-4 text-emerald-400" />{item}</span>)}</div></div></div></article>)}</div></section>
    <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10"><div className="grid overflow-hidden rounded-2xl border border-white/15 bg-[#0d1728] md:grid-cols-2"><div className="p-7 sm:p-9"><span className="rounded-full bg-slate-600 px-4 py-2 font-semibold text-white">Available in the project</span><p className="mt-5 text-slate-300">Control access to supported Google tasks. Hosted execution is still being verified in the private pilot.</p><div className="mt-8 grid grid-cols-4 gap-2 text-center text-xs text-slate-300">{['Connect accounts','Choose resources','Enable tools','Approve writes separately'].map((x) => <div key={x}><div className="mx-auto mb-3 grid size-10 place-items-center rounded-full border border-slate-400/50"><Settings2 className="size-5" /></div>{x}</div>)}</div></div><div className="bg-emerald-500/10 p-7 sm:p-9"><span className="rounded-full bg-emerald-500 px-4 py-2 font-semibold text-white">Next: natural-language tasks</span><p className="mt-5 text-slate-300">The target is to describe a marketing task in plain English and have an agent carry it out with your permission. This is not a verified hosted feature today.</p><div className="mt-8 grid grid-cols-4 gap-2 text-center text-xs text-slate-300">{['Describe the task','Review the action','Approve changes','Check the result'].map((x) => <div key={x}><div className="mx-auto mb-3 grid size-10 place-items-center rounded-full border border-emerald-400/70 text-emerald-300"><Check className="size-5" /></div>{x}</div>)}</div></div></div></section>
    <section className="relative px-6 pb-20 pt-8 text-center"><div className="mx-auto max-w-4xl"><SectionHeading>Put your Google tools to work.</SectionHeading><div className="mt-8 grid gap-5 text-left sm:grid-cols-3"><Value icon={Sparkles} text="Choose which accounts and assets your agent can use" /><Value icon={Users} text="See which connections need attention" /><Value icon={Gauge} text="Grant write access only where you need it" /></div><Button asChild size="lg" className="mt-10 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-8 text-base font-semibold shadow-lg shadow-blue-900/50"><a href="https://github.com/Rajeev-SG/gog-marketing#getting-started">Read the setup guide <ArrowRight data-icon="inline-end" /></a></Button><p className="mt-5 text-slate-400">The guide covers administrator setup and approved agent access. Hosted access is limited to the private pilot; pricing and public signup are not announced.</p></div></section>
  </div>
}
function Value({ icon: Icon, text }: { icon: typeof Sparkles; text: string }) { return <div className="flex items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-violet-500/20 text-violet-300"><Icon className="size-6" /></span><span className="text-slate-300">{text}</span></div> }
