'use client';

import React, { useState, useEffect } from 'react';
import { entities, auth } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Scissors } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import SurgeryForm from '@/components/surgery/SurgeryForm';
import SurgeryCard from '@/components/surgery/SurgeryCard';
import StepsSummary from '@/components/surgery/StepsSummary';
import { SURGERY_STEPS } from '@/components/shared/SurgerySteps';

export default function Surgeries() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSurgery, setEditingSurgery] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    auth.me().then(setUser);
  }, []);

  const { data: surgeries = [], isLoading } = useQuery({
    queryKey: ['surgeries', user?.email],
    queryFn: () => entities.Surgery.filter({ resident_email: user.email }, '-surgery_date'),
    enabled: !!user?.email
  });

  const createMutation = useMutation({
    mutationFn: (data) => entities.Surgery.create({ ...data, resident_email: user.email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surgeries'] });
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.Surgery.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surgeries'] });
      setEditingSurgery(null);
      setShowForm(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.Surgery.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['surgeries'] })
  });

  const handleSubmit = (data) => {
    if (editingSurgery) {
      updateMutation.mutate({ id: editingSurgery.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (surgery) => {
    setEditingSurgery(surgery);
    setShowForm(true);
  };

  if (!user || isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-4xl mx-auto" dir="rtl">
        <Skeleton className="h-8 w-48" />
        {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent/10">
            <Scissors className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">ניתוחים</h1>
            <p className="text-xs text-muted-foreground">{surgeries.length} ניתוחים תועדו</p>
          </div>
        </div>
        <Button onClick={() => { setEditingSurgery(null); setShowForm(!showForm); }} className="gap-1.5">
          <Plus className="w-4 h-4" />
          ניתוח חדש
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <SurgeryForm
              onSubmit={handleSubmit}
              onCancel={() => { setShowForm(false); setEditingSurgery(null); }}
              initialData={editingSurgery}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {surgeries.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{surgeries.length}</p>
            <p className="text-xs text-muted-foreground mt-1">סה״כ ניתוחים</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-accent">
              {surgeries.filter(s => s.steps_performed?.length === SURGERY_STEPS.length).length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">ניתוחים מלאים</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {surgeries.map((surgery) => (
          <SurgeryCard
            key={surgery.id}
            surgery={surgery}
            onEdit={handleEdit}
            onDelete={(id) => deleteMutation.mutate(id)}
            isAdmin={false}
          />
        ))}
        {surgeries.length === 0 && !showForm && (
          <div className="text-center py-12 text-muted-foreground">
            <Scissors className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">עדיין לא תועדו ניתוחים</p>
            <p className="text-xs mt-1">לחצו על "ניתוח חדש" כדי להתחיל</p>
          </div>
        )}
      </div>
    </div>
  );
}
