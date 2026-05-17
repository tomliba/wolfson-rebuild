'use client';

import React, { useState, useEffect } from 'react';
import { entities, auth } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, ClipboardCheck, Scissors, Film, ChevronLeft } from "lucide-react";
import ProgressRing from '@/components/shared/ProgressRing';
import TaskList from '@/components/tasks/TaskList';
import SurgeryCard from '@/components/surgery/SurgeryCard';
import StepsSummary from '@/components/surgery/StepsSummary';
import VideoCard from '@/components/video/VideoCard';
import { SURGERY_STEPS } from '@/components/shared/SurgerySteps';

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [selectedResident, setSelectedResident] = useState(null);
  const router = useRouter();

  useEffect(() => {
    auth.me().then((u) => {
      if (u && u.role !== 'admin') {
        router.push('/');
      } else {
        setUser(u);
      }
    });
  }, [router]);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => entities.User.list()
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => entities.OneTimeTask.list()
  });

  const { data: allCompletions = [] } = useQuery({
    queryKey: ['all-completions'],
    queryFn: () => entities.TaskCompletion.list()
  });

  const { data: allSurgeries = [] } = useQuery({
    queryKey: ['all-surgeries'],
    queryFn: () => entities.Surgery.list('-surgery_date')
  });

  const { data: allVideos = [] } = useQuery({
    queryKey: ['all-videos'],
    queryFn: () => entities.VideoReview.list('-review_date')
  });

  if (!user) {
    return (
      <div className="p-6 space-y-4 max-w-5xl mx-auto" dir="rtl">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const residents = users.filter(u => u.role !== 'admin');

  const getResidentData = (email) => {
    const completions = allCompletions.filter(c => c.resident_email === email);
    const surgeries = allSurgeries.filter(s => s.resident_email === email);
    const videos = allVideos.filter(v => v.resident_email === email);
    const taskProgress = tasks.length > 0 ? (completions.length / tasks.length) * 100 : 0;
    return { completions, surgeries, videos, taskProgress };
  };

  if (selectedResident) {
    const data = getResidentData(selectedResident.email);
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto" dir="rtl">
        <button
          onClick={() => setSelectedResident(null)}
          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          חזרה לרשימת מתמחים
        </button>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
            {selectedResident.full_name?.[0] || selectedResident.email[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{selectedResident.full_name || selectedResident.email}</h1>
            <p className="text-xs text-muted-foreground">{selectedResident.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 text-center">
            <ProgressRing progress={data.taskProgress} size={50} strokeWidth={4} />
            <p className="text-xs text-muted-foreground mt-2">מטלות</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{data.surgeries.length}</p>
            <p className="text-xs text-muted-foreground mt-1">ניתוחים</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{data.videos.length}</p>
            <p className="text-xs text-muted-foreground mt-1">סרטים</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-accent">{data.videos.filter(v => v.presented_in_meeting).length}</p>
            <p className="text-xs text-muted-foreground mt-1">הוצגו בשמיים</p>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            מטלות חד-פעמיות
          </h2>
          <TaskList tasks={tasks} completions={data.completions} isAdmin={true} onComplete={() => {}} onRemoveCompletion={() => {}} />
        </div>

        {data.surgeries.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Scissors className="w-5 h-5 text-accent" />
              ניתוחים ({data.surgeries.length})
            </h2>
            <StepsSummary surgeries={data.surgeries} />
            <div className="space-y-3">
              {data.surgeries.map(s => (
                <SurgeryCard key={s.id} surgery={s} isAdmin={true} onEdit={() => {}} onDelete={() => {}} />
              ))}
            </div>
          </div>
        )}

        {data.videos.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Film className="w-5 h-5 text-primary" />
              סרטי ניתוחים ({data.videos.length})
            </h2>
            <div className="space-y-3">
              {data.videos.map(v => (
                <VideoCard key={v.id} review={v} isAdmin={true} onEdit={() => {}} onDelete={() => {}} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">פאנל ניהול</h1>
          <p className="text-xs text-muted-foreground">{residents.length} מתמחים רשומים</p>
        </div>
      </div>

      <div className="grid gap-3">
        {residents.map((resident) => {
          const data = getResidentData(resident.email);
          return (
            <Card
              key={resident.id}
              className="p-4 cursor-pointer hover:shadow-md transition-all hover:border-primary/20"
              onClick={() => setSelectedResident(resident)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                  {resident.full_name?.[0] || resident.email[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground">{resident.full_name || resident.email}</h3>
                  <p className="text-xs text-muted-foreground">{resident.email}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center hidden sm:block">
                    <p className="text-xs text-muted-foreground">מטלות</p>
                    <ProgressRing progress={data.taskProgress} size={36} strokeWidth={3} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">ניתוחים</p>
                    <p className="font-bold text-sm">{data.surgeries.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">סרטים</p>
                    <p className="font-bold text-sm">{data.videos.length}</p>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </Card>
          );
        })}
        {residents.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">אין מתמחים רשומים עדיין</p>
            <p className="text-xs mt-1">הזמן מתמחים דרך הגדרות המערכת</p>
          </div>
        )}
      </div>
    </div>
  );
}
