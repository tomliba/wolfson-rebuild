import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Save, X } from "lucide-react";
import { SURGERY_STEPS, PHACO_LASER_STEPS, COMPLEX_TYPES, COMPLICATIONS_LIST } from "../shared/SurgerySteps";

const SURGERY_TYPES = [
  { id: "phaco", label: "פאקו" },
  { id: "phacolaser", label: "פאקולייזר" },
];

export default function SurgeryForm({ onSubmit, onCancel, initialData }) {
  const [surgeryType, setSurgeryType] = useState(initialData?.surgery_type || "phaco");
  const [formData, setFormData] = useState(initialData || {
    surgery_date: format(new Date(), 'yyyy-MM-dd'),
    patient_initials: "",
    eye: "",
    supervising_surgeon: "",
    steps_performed: [],
    complications: "",
    notes: ""
  });

  const activeSteps = surgeryType === "phacolaser" ? PHACO_LASER_STEPS : SURGERY_STEPS;

  const [dateObj, setDateObj] = useState(initialData?.surgery_date ? new Date(initialData.surgery_date) : new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  const toggleStep = (stepId) => {
    setFormData(prev => ({
      ...prev,
      steps_performed: prev.steps_performed.includes(stepId)
        ? prev.steps_performed.filter(s => s !== stepId)
        : [...prev.steps_performed, stepId]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, surgery_type: surgeryType, surgery_date: format(dateObj, 'yyyy-MM-dd') });
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">
          {initialData ? "עריכת ניתוח" : "תיעוד ניתוח חדש"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex gap-2">
            {SURGERY_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { setSurgeryType(t.id); setFormData(prev => ({ ...prev, steps_performed: [] })); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                  surgeryType === t.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:bg-muted'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">תאריך ניתוח</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-sm">
                    <CalendarIcon className="w-4 h-4 ml-2" />
                    {format(dateObj, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateObj} onSelect={(d) => { if (d) { setDateObj(d); setCalendarOpen(false); } }} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">ראשי תיבות מטופל</Label>
              <Input
                value={formData.patient_initials}
                onChange={(e) => setFormData({ ...formData, patient_initials: e.target.value })}
                placeholder="לדוגמה: א.כ"
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">עין</Label>
              <Select value={formData.eye} onValueChange={(v) => setFormData({ ...formData, eye: v })}>
                <SelectTrigger><SelectValue placeholder="בחר עין" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="right">ימין</SelectItem>
                  <SelectItem value="left">שמאל</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">מנתח מפקח</Label>
              <Input
                value={formData.supervising_surgeon}
                onChange={(e) => setFormData({ ...formData, supervising_surgeon: e.target.value })}
                placeholder="שם המנתח המפקח"
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">שלבים שבוצעו</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeSteps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    formData.steps_performed.includes(step.id)
                      ? 'bg-primary/5 border-primary/30'
                      : 'hover:bg-muted border-border'
                  }`}
                  onClick={(e) => { if (!e.isTrusted) return; toggleStep(step.id); }}
                >
                  <Checkbox
                    checked={formData.steps_performed.includes(step.id)}
                    className="pointer-events-none"
                  />
                  <span className="text-sm">{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">ניתוח מורכב</Label>
            <div className="grid grid-cols-2 gap-2">
              {COMPLEX_TYPES.map((type) => {
                const active = formData.notes?.includes(type);
                return (
                  <div
                    key={type}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      active ? 'bg-orange-50 border-orange-300' : 'hover:bg-muted border-border'
                    }`}
                    onClick={(e) => {
                      if (!e.isTrusted) return;
                      const current = formData.notes || '';
                      const updated = active
                        ? current.replace(type, '').replace(/^,\s*|,\s*$|,\s*,/g, '').trim()
                        : current ? `${current}, ${type}` : type;
                      setFormData({ ...formData, notes: updated });
                    }}
                  >
                    <Checkbox checked={active} className="pointer-events-none" />
                    <span className="text-sm">{type}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">סיבוכים</Label>
            <div className="grid grid-cols-2 gap-2">
              {COMPLICATIONS_LIST.map((comp) => {
                const active = formData.complications?.includes(comp);
                return (
                  <div
                    key={comp}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      active ? 'bg-red-50 border-red-300' : 'hover:bg-muted border-border'
                    }`}
                    onClick={(e) => {
                      if (!e.isTrusted) return;
                      const current = formData.complications || '';
                      const updated = active
                        ? current.replace(comp, '').replace(/^,\s*|,\s*$|,\s*,/g, '').trim()
                        : current ? `${current}, ${comp}` : comp;
                      setFormData({ ...formData, complications: updated });
                    }}
                  >
                    <Checkbox checked={active} className="pointer-events-none" />
                    <span className="text-sm">{comp}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">הערות נוספות</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="הערות נוספות..."
              className="text-sm h-16"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="gap-1.5">
              <Save className="w-4 h-4" />
              {initialData ? "עדכן" : "שמור ניתוח"}
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              <X className="w-4 h-4 ml-1" /> ביטול
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}