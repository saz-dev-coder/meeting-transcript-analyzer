import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BarChart3, TrendingUp, Users, Target } from 'lucide-react';
import type { Task, Profile } from '@/lib/types';
import { Avatar } from '@/components/Avatar';

interface TeamAnalyticsProps {
  tasks: Task[];
  profiles: Profile[];
}

const BAR_COLORS: Record<string, string> = {
  total: '#3380ff',
  done: '#10b981',
  inProgress: '#fbbf24',
  todo: '#8492a8',
};

export function TeamAnalytics({ tasks, profiles }: TeamAnalyticsProps) {
  const workloadData = useMemo(() => {
    return profiles.map((p) => {
      const memberTasks = tasks.filter((t) => t.assignee_id === p.id);
      const done = memberTasks.filter((t) => t.status === 'done').length;
      const inProgress = memberTasks.filter((t) => t.status === 'in_progress').length;
      const todo = memberTasks.filter((t) => t.status === 'todo').length;
      return {
        name: p.full_name,
        shortName: p.full_name.split(' ')[0],
        total: memberTasks.length,
        done,
        inProgress,
        todo,
        completionRate: memberTasks.length > 0 ? Math.round((done / memberTasks.length) * 100) : 0,
      };
    });
  }, [tasks, profiles]);

  const statusDistribution = useMemo(() => {
    const done = tasks.filter((t) => t.status === 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const todo = tasks.filter((t) => t.status === 'todo').length;
    return [
      { name: 'Done', value: done, color: '#10b981' },
      { name: 'In Progress', value: inProgress, color: '#3380ff' },
      { name: 'To Do', value: todo, color: '#8492a8' },
    ];
  }, [tasks]);

  const avgCompletion = workloadData.length > 0
    ? Math.round(workloadData.reduce((sum, m) => sum + m.completionRate, 0) / workloadData.length)
    : 0;

  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    tasks.forEach((t) => {
      categories[t.category] = (categories[t.category] ?? 0) + 1;
    });
    return Object.entries(categories)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [tasks]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-400" />
          Team Analytics
        </h1>
        <p className="text-sm text-ink-400 mt-1">
          Real-time productivity metrics · Updates instantly when tasks change
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Team Members" value={profiles.length} color="text-brand-400" bg="bg-brand-500/10" />
        <StatCard icon={Target} label="Total Tasks" value={tasks.length} color="text-accent-400" bg="bg-accent-500/10" />
        <StatCard icon={TrendingUp} label="Avg Completion" value={`${avgCompletion}%`} color="text-success-400" bg="bg-success-500/10" />
        <StatCard icon={BarChart3} label="Categories" value={categoryData.length} color="text-warning-400" bg="bg-warning-500/10" />
      </div>

      {/* Workload bar graph */}
      <div className="bg-ink-900 border border-ink-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-brand-400" />
          <h2 className="text-sm font-semibold text-white">Workload Distribution</h2>
          <span className="text-xs text-ink-500">— Total tasks per team member</span>
        </div>
        {workloadData.length === 0 ? (
          <p className="text-sm text-ink-500 py-12 text-center">No team members to display.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={workloadData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#363d4d" vertical={false} />
              <XAxis
                dataKey="shortName"
                tick={{ fill: '#8492a8', fontSize: 12 }}
                axisLine={{ stroke: '#363d4d' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#8492a8', fontSize: 12 }}
                axisLine={{ stroke: '#363d4d' }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(51, 128, 255, 0.05)' }}
                contentStyle={{
                  backgroundColor: '#0f1420',
                  border: '1px solid #3f485b',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#eceef2',
                }}
                labelStyle={{ color: '#eceef2', fontWeight: 600 }}
              />
              <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]} maxBarSize={60}>
                {workloadData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={BAR_COLORS.total} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Stacked status bar graph */}
      <div className="bg-ink-900 border border-ink-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-success-400" />
          <h2 className="text-sm font-semibold text-white">Task Status Breakdown</h2>
          <span className="text-xs text-ink-500">— Stacked by status per member</span>
        </div>
        {workloadData.length === 0 ? (
          <p className="text-sm text-ink-500 py-12 text-center">No data to display.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={workloadData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#363d4d" vertical={false} />
              <XAxis
                dataKey="shortName"
                tick={{ fill: '#8492a8', fontSize: 12 }}
                axisLine={{ stroke: '#363d4d' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#8492a8', fontSize: 12 }}
                axisLine={{ stroke: '#363d4d' }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(51, 128, 255, 0.05)' }}
                contentStyle={{
                  backgroundColor: '#0f1420',
                  border: '1px solid #3f485b',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#eceef2',
                }}
                labelStyle={{ color: '#eceef2', fontWeight: 600 }}
              />
              <Bar dataKey="done" name="Done" stackId="a" fill={BAR_COLORS.done} radius={[0, 0, 0, 0]} maxBarSize={60} />
              <Bar dataKey="inProgress" name="In Progress" stackId="a" fill={BAR_COLORS.inProgress} radius={[0, 0, 0, 0]} maxBarSize={60} />
              <Bar dataKey="todo" name="To Do" stackId="a" fill={BAR_COLORS.todo} radius={[4, 4, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="flex items-center gap-4 mt-3 justify-center">
          <Legend color={BAR_COLORS.done} label="Done" />
          <Legend color={BAR_COLORS.inProgress} label="In Progress" />
          <Legend color={BAR_COLORS.todo} label="To Do" />
        </div>
      </div>

      {/* Individual productivity modules */}
      <div className="bg-ink-900 border border-ink-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-success-400" />
          <h2 className="text-sm font-semibold text-white">Individual Productivity</h2>
          <span className="text-xs text-ink-500">— Completion rate per member</span>
        </div>
        {workloadData.length === 0 ? (
          <p className="text-sm text-ink-500 py-12 text-center">No team members to display.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workloadData.map((member) => (
              <div
                key={member.name}
                className="bg-ink-800/40 border border-ink-800 rounded-xl p-4 hover:border-ink-700 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar
                    initials={profiles.find((p) => p.full_name === member.name)?.avatar_initials ?? member.name.slice(0, 2)}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{member.name}</div>
                    <div className="text-xs text-ink-500">
                      {member.done} done · {member.inProgress} in progress · {member.todo} to do
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-lg font-bold tabular-nums ${member.completionRate >= 75 ? 'text-success-300' : member.completionRate >= 50 ? 'text-brand-300' : 'text-warning-300'}`}>
                      {member.completionRate}%
                    </div>
                    <div className="text-[10px] text-ink-500">{member.done}/{member.total} tasks</div>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-ink-700/60 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      member.completionRate >= 75 ? 'bg-success-400' : member.completionRate >= 50 ? 'bg-brand-400' : 'bg-warning-400'
                    }`}
                    style={{ width: `${member.completionRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category distribution */}
      {categoryData.length > 0 && (
        <div className="bg-ink-900 border border-ink-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-accent-400" />
            <h2 className="text-sm font-semibold text-white">Tasks by Category</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#363d4d" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: '#8492a8', fontSize: 12 }}
                axisLine={{ stroke: '#363d4d' }}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#8492a8', fontSize: 12 }}
                axisLine={{ stroke: '#363d4d' }}
                tickLine={false}
                width={100}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255, 122, 19, 0.05)' }}
                contentStyle={{
                  backgroundColor: '#0f1420',
                  border: '1px solid #3f485b',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#eceef2',
                }}
              />
              <Bar dataKey="count" name="Tasks" radius={[0, 4, 4, 0]} maxBarSize={30}>
                {categoryData.map((_, index) => (
                  <Cell key={`cat-${index}`} fill="#ff7a13" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Status distribution summary */}
      <div className="grid grid-cols-3 gap-4">
        {statusDistribution.map((s) => (
          <div key={s.name} className="bg-ink-900 border border-ink-800 rounded-xl p-4 text-center">
            <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: s.color }} />
            <div className="text-2xl font-bold text-white tabular-nums">{s.value}</div>
            <div className="text-xs text-ink-400 mt-0.5">{s.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-ink-900 border border-ink-800 rounded-xl p-4 hover:border-ink-700 transition-colors">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bg} mb-3`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
      <div className="text-xs text-ink-400 mt-0.5">{label}</div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
      <span className="text-xs text-ink-400">{label}</span>
    </div>
  );
}
