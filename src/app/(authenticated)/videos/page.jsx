'use client';

import React, { useState, useEffect } from 'react';
import { entities, auth } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Film } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import VideoForm from '@/components/video/VideoForm';
import VideoCard from '@/components/video/VideoCard';

export default function Videos() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    auth.me().then(setUser);
  }, []);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['videos', user?.email],
    queryFn: () => entities.VideoReview.filter({ resident_email: user.email }, '-review_date'),
    enabled: !!user?.email
  });

  const createMutation = useMutation({
    mutationFn: (data) => entities.VideoReview.create({ ...data, resident_email: user.email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.VideoReview.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      setEditingVideo(null);
      setShowForm(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.VideoReview.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['videos'] })
  });

  const handleSubmit = (data) => {
    if (editingVideo) {
      updateMutation.mutate({ id: editingVideo.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (video) => {
    setEditingVideo(video);
    setShowForm(true);
  };

  if (!user || isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-3xl mx-auto" dir="rtl">
        <Skeleton className="h-8 w-48" />
        {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  const presented = videos.filter(v => v.presented_in_meeting).length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Film className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">סרטי ניתוחים</h1>
            <p className="text-xs text-muted-foreground">
              {videos.length} סרטים • {presented} הוצגו בשמיים
            </p>
          </div>
        </div>
        <Button onClick={() => { setEditingVideo(null); setShowForm(!showForm); }} className="gap-1.5">
          <Plus className="w-4 h-4" />
          סרט חדש
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <VideoForm
              onSubmit={handleSubmit}
              onCancel={() => { setShowForm(false); setEditingVideo(null); }}
              initialData={editingVideo}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            review={video}
            onEdit={handleEdit}
            onDelete={(id) => deleteMutation.mutate(id)}
            isAdmin={false}
          />
        ))}
        {videos.length === 0 && !showForm && (
          <div className="text-center py-12 text-muted-foreground">
            <Film className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">עדיין לא תועדו סרטי ניתוחים</p>
            <p className="text-xs mt-1">לחצו על "סרט חדש" כדי להתחיל</p>
          </div>
        )}
      </div>
    </div>
  );
}
