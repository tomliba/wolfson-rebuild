import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Plus, X } from "lucide-react";
import { entities } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function WetLabPractice({ userEmail, isAdmin }) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [newDate, setNewDate] = useState(new Date());
  const queryClient = useQueryClient();

  const { data: sessions = [] } = useQuery({
    queryKey: ['wetlab', userEmail],
    queryFn: () => entities.WetLabSession.filter({ resident_email: userEmail }),
    enabled: !!userEmail
  });

  const createMutation = useMutation({
    mutationFn: (data) => entities.WetLabSession.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wetlab'] });
      setShowCalendar(false);
      setNewDate(new Date());
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.WetLabSession.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wetlab'] })
  });

  const handleSave = (date) => {
    createMutation.mutate({
      resident_email: userEmail,
      practice_date: format(date, 'yyyy-MM-dd'),
      steps_practiced: []
    });
  };

  const sorted = [...sessions].sort((a, b) => (b.practice_date || '').localeCompare(a.practice_date || ''));

  return (
    <div className="mt-3 space-y-2" dir="rtl">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium">יומן תרגול ({sessions.length} פגישות)</p>
        {!isAdmin && (
          <Popover open={showCalendar} onOpenChange={setShowCalendar}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" className="text-xs gap-1.5 h-7">
                <Plus className="w-3.5 h-3.5" />
                הוסף תאריך
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={newDate}
                onSelect={(d) => {
                  if (d) {
                    setNewDate(d);
                    handleSave(d);
                  }
                }}
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      {sorted.length === 0 && (
        <p className="text-xs text-muted-foreground py-2">אין פגישות תרגול עדיין</p>
      )}

      <div className="flex flex-wrap gap-2">
        {sorted.map((session) => (
          <div key={session.id} className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-700 text-xs px-2.5 py-1 rounded-full">
            <CalendarIcon className="w-3 h-3" />
            {format(new Date(session.practice_date), 'dd/MM/yyyy')}
            {!isAdmin && (
              <button onClick={() => deleteMutation.mutate(session.id)} className="text-purple-400 hover:text-destructive mr-0.5">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}