'use client';

import React, { useState, useEffect } from 'react';
import { entities, auth } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck } from "lucide-react";
import TaskList from '@/components/tasks/TaskList';
import ProgressRing from '@/components/shared/ProgressRing';


export default function Tasks() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    auth.me().then(setUser);
  }, []);

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => entities.OneTimeTask.list()
  });

  const { data: completions = [], isLoading: completionsLoading } = useQuery({
    queryKey: ['completions', user?.email],
    queryFn: () => entities.TaskCompletion.filter({ resident_email: user.email }),
    enabled: !!user?.email
  });

  const completeMutation = useMutation({
    mutationFn: (data) => entities.TaskCompletion.create({
      ...data,
      resident_email: user.email
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['completions'] })
  });

  const removeMutation = useMutation({
    mutationFn: (id) => entities.TaskCompletion.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['completions'] })
  });

  if (!user || tasksLoading) {
    return (
      <div className="p-6 space-y-4 max-w-3xl mx-auto" dir="rtl">
        <Skeleton className="h-8 w-48" />
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    );
  }

  const progress = tasks.length > 0 ? (completions.length / tasks.length) * 100 : 0;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <ClipboardCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">מטלות חד-פעמיות</h1>
            <p className="text-xs text-muted-foreground">{completions.length} מתוך {tasks.length} הושלמו</p>
          </div>
        </div>
        <ProgressRing progress={progress} size={56} strokeWidth={5} />
      </div>

      <TaskList
        tasks={tasks}
        completions={completions}
        onComplete={(data) => completeMutation.mutate(data)}
        onRemoveCompletion={(id) => removeMutation.mutate(id)}
        isAdmin={false}
        userEmail={user.email}
      />
    </div>
  );
}
