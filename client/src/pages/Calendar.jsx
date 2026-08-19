import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarPage() {
    const [current, setCurrent] = useState(new Date());
    const [holidays, setHolidays] = useState([]);
    const [events, setEvents] = useState([]);
    const [reminders, setReminders] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventDesc, setNewEventDesc] = useState('');

    const year = current.getFullYear();
    const month = current.getMonth();

    useEffect(() => {
        apiFetch(`/api/holidays/${year}`).then(setHolidays).catch(() => setHolidays([]));
        apiFetch('/api/calendar-events').then(setEvents);
        apiFetch('/api/reminders').then(setReminders);
    }, [year]);

    const days = useMemo(() => {
        const firstDay = new Date(year, month, 1);
        const startWeekday = firstDay.getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < startWeekday; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        return cells;
    }, [year, month]);

    function dateKey(d) {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    function holidaysOn(d) {
        const key = dateKey(d);
        return holidays.filter((h) => h.date === key);
    }

    function eventsOn(d) {
        const key = dateKey(d);
        return events.filter((e) => e.event_date === key);
    }

    function remindersOn(d) {
        const key = dateKey(d);
        return reminders.filter((r) => r.remind_at?.slice(0, 10) === key);
    }

    function isToday(d) {
        const today = new Date();
        return d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    }

    function changeMonth(delta) {
        setCurrent(new Date(year, month + delta, 1));
    }

    async function addEvent(e) {
        e.preventDefault();
        if (!newEventTitle.trim() || !selectedDate) return;
        await apiFetch('/api/calendar-events', {
            method: 'POST',
            body: JSON.stringify({ title: newEventTitle, event_date: dateKey(selectedDate), description: newEventDesc }),
        });
        setNewEventTitle('');
        setNewEventDesc('');
        const updated = await apiFetch('/api/calendar-events');
        setEvents(updated);
    }

    async function deleteEvent(id) {
        await apiFetch(`/api/calendar-events/${id}`, { method: 'DELETE' });
        const updated = await apiFetch('/api/calendar-events');
        setEvents(updated);
    }

    return (
        <main className="max-w-4xl mx-auto px-6 py-10">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-300">Calendar</h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => changeMonth(-1)} className="text-gray-400 hover:text-white px-1">←</button>
                    <select
                        value={month}
                        onChange={(e) => setCurrent(new Date(year, Number(e.target.value), 1))}
                        className="bg-diwa-card border border-white/10 rounded px-2 py-1 text-sm text-gray-200 outline-none"
                    >
                        {MONTH_NAMES.map((m, i) => <option key={m} value={i}>{m}</option>)}
                    </select>
                    <select
                        value={year}
                        onChange={(e) => setCurrent(new Date(Number(e.target.value), month, 1))}
                        className="bg-diwa-card border border-white/10 rounded px-2 py-1 text-sm text-gray-200 outline-none"
                    >
                        {Array.from({ length: 11 }, (_, i) => year - 5 + i).map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <button onClick={() => changeMonth(1)} className="text-gray-400 hover:text-white px-1">→</button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-400 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days.map((d, i) => {
                    if (!d) return <div key={i} />;
                    const dHolidays = holidaysOn(d);
                    const dEvents = eventsOn(d);
                    const dReminders = remindersOn(d);
                    const hasStuff = dHolidays.length + dEvents.length + dReminders.length > 0;
                    return (
                        <button
                            key={i}
                            onClick={() => setSelectedDate(d)}
                            className={`min-h-[70px] rounded-lg border p-1.5 text-left text-xs transition-colors flex flex-col gap-0.5 border-white/5 hover:border-white/20 ${isToday(d) ? 'ring-1 ring-diwa-purple-light' : ''
                                }`}
                        >
                            <span className="text-gray-300">{d}</span>
                            <div className="flex-1 min-h-0 overflow-hidden">
                                {dHolidays[0] && (
                                    <p className="text-[10px] text-amber-400 truncate leading-tight">{dHolidays[0].localName || dHolidays[0].name}</p>
                                )}
                                {dEvents[0] && (
                                    <p className="text-[10px] text-diwa-purple-light truncate leading-tight">{dEvents[0].title}</p>
                                )}
                                {dReminders[0] && (
                                    <p className="text-[10px] text-diwa-indigo-light truncate leading-tight">{dReminders[0].note_title || 'Reminder'}</p>
                                )}
                            </div>
                            {hasStuff && (dHolidays.length + dEvents.length + dReminders.length > 3) && (
                                <span className="text-[9px] text-gray-500">+more</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {selectedDate && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDate(null)}>
                    <div className="bg-diwa-dark border border-white/10 rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-lg font-semibold">{MONTH_NAMES[month]} {selectedDate}, {year}</p>
                            <button onClick={() => setSelectedDate(null)} className="text-gray-400 hover:text-white">
                                <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                            </button>
                        </div>

                        {holidaysOn(selectedDate).map((h) => (
                            <p key={h.date} className="text-sm text-amber-400 mb-2">🎉 {h.localName || h.name}</p>
                        ))}

                        {eventsOn(selectedDate).map((ev) => (
                            <div key={ev.id} className="flex justify-between items-start gap-2 bg-diwa-card border border-white/5 rounded-lg p-2 mb-2">
                                <div>
                                    <p className="text-sm text-diwa-purple-light">{ev.title}</p>
                                    {ev.description && <p className="text-xs text-gray-500">{ev.description}</p>}
                                </div>
                                <button onClick={() => deleteEvent(ev.id)} className="text-xs text-gray-500 hover:text-red-400 shrink-0">×</button>
                            </div>
                        ))}

                        {remindersOn(selectedDate).map((r) => (
                            <p key={r.id} className="text-sm text-diwa-indigo-light mb-2">🔔 {r.note_title || r.task_title || 'Reminder'}</p>
                        ))}

                        <form onSubmit={addEvent} className="mt-4 flex flex-col gap-2 border-t border-white/5 pt-4">
                            <input
                                type="text"
                                placeholder="Add an event..."
                                value={newEventTitle}
                                onChange={(e) => setNewEventTitle(e.target.value)}
                                className="bg-diwa-card border border-white/10 rounded px-3 py-1.5 text-sm outline-none placeholder-gray-500 focus:border-diwa-indigo"
                            />
                            <input
                                type="text"
                                placeholder="Description (optional)"
                                value={newEventDesc}
                                onChange={(e) => setNewEventDesc(e.target.value)}
                                className="bg-diwa-card border border-white/10 rounded px-3 py-1.5 text-sm outline-none placeholder-gray-500 focus:border-diwa-indigo"
                            />
                            <button type="submit" className="self-end bg-diwa-indigo hover:bg-diwa-purple text-sm px-4 py-1.5 rounded-lg transition-colors">
                                Add
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}