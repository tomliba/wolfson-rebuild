import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WetLabPractice from './WetLabPractice';
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { CheckCircle2, Circle, CalendarIcon, Pencil, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TaskList({ tasks, completions, onComplete, onRemoveCompletion, isAdmin, userEmail }) {
  const [editingTask, setEditingTask] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [notes, setNotes] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const getCompletion = (taskId) => {
    return completions.find(c => c.task_id === taskId);
  };

  const handleComplete = (taskId) => {
    onComplete({
      task_id: taskId,
      completion_date: format(selectedDate, 'yyyy-MM-dd'),
      notes
    });
    setEditingTask(null);
    setNotes("");
    setSelectedDate(new Date());
  };

  const sortedTasks = [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {sortedTasks.map((task, index) => {
          const completion = getCompletion(task.id);
          const isCompleted = !!completion;
          const isEditing = editingTask === task.id;

          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`p-4 transition-all ${isCompleted ? 'bg-accent/5 border-accent/30' : 'hover:shadow-sm'}`}>
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => {
                      if (isCompleted) return;
                      setEditingTask(isEditing ? null : task.id);
                    }}
                    className="mt-0.5 shrink-0"
                    disabled={isAdmin}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-accent" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`font-medium text-sm ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.task_name}
                      </h3>
                      {isCompleted && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs bg-accent/10 text-accent shrink-0">
                            {format(new Date(completion.completion_date), 'dd/MM/yyyy')}
                          </Badge>
                          {!isAdmin && (
                            <button onClick={() => onRemoveCompletion(completion.id)} className="text-muted-foreground hover:text-destructive">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                    )}
                    {completion?.notes && (
                      <p className="text-xs text-accent mt-1">📝 {completion.notes}</p>
                    )}

                    {task.task_name?.includes('עיניים מלאכותיות') && userEmail && (
                      <div className="mt-4">
                        <WetLabPractice userEmail={userEmail} isAdmin={isAdmin} />
                      </div>
                    )}

                    {isEditing && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 space-y-3"
                      >
                        <div className="flex gap-2 items-end flex-wrap">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">תאריך ביצוע</label>
                            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="text-xs">
                                  <CalendarIcon className="w-3.5 h-3.5 ml-1.5" />
                                  {format(selectedDate, 'dd/MM/yyyy')}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={selectedDate} onSelect={(d) => { if (d) { setSelectedDate(d); setCalendarOpen(false); } }} />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="flex-1 min-w-[150px]">
                            <label className="text-xs text-muted-foreground mb-1 block">הערות (אופציונלי)</label>
                            <Input
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="הערות..."
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="text-xs h-7" onClick={() => handleComplete(task.id)}>
                            סמן כבוצע
                          </Button>
                          <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setEditingTask(null)}>
                            ביטול
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}