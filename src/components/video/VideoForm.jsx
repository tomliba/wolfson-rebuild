import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Save, X } from "lucide-react";

export default function VideoForm({ onSubmit, onCancel, initialData }) {
  const [formData, setFormData] = useState(initialData || {
    review_date: format(new Date(), 'yyyy-MM-dd'),
    senior_doctor: "",
    video_description: "",
    presented_in_meeting: false,
    meeting_date: "",
    feedback: "",
    notes: ""
  });

  const [reviewDateObj, setReviewDateObj] = useState(
    initialData?.review_date ? new Date(initialData.review_date) : new Date()
  );
  const [meetingDateObj, setMeetingDateObj] = useState(
    initialData?.meeting_date ? new Date(initialData.meeting_date) : new Date()
  );
  const [reviewCalendarOpen, setReviewCalendarOpen] = useState(false);
  const [meetingCalendarOpen, setMeetingCalendarOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      review_date: format(reviewDateObj, 'yyyy-MM-dd'),
      meeting_date: formData.presented_in_meeting ? format(meetingDateObj, 'yyyy-MM-dd') : ""
    });
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">
          {initialData ? "עריכת סרט ניתוח" : "תיעוד סרט ניתוח חדש"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">תאריך מעבר</Label>
              <Popover open={reviewCalendarOpen} onOpenChange={setReviewCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-sm">
                    <CalendarIcon className="w-4 h-4 ml-2" />
                    {format(reviewDateObj, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={reviewDateObj} onSelect={(d) => { if (d) { setReviewDateObj(d); setReviewCalendarOpen(false); } }} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">רופא בכיר</Label>
              <Input
                value={formData.senior_doctor}
                onChange={(e) => setFormData({ ...formData, senior_doctor: e.target.value })}
                placeholder="שם הרופא הבכיר"
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">תיאור הסרטון</Label>
            <Textarea
              value={formData.video_description}
              onChange={(e) => setFormData({ ...formData, video_description: e.target.value })}
              placeholder="תיאור תוכן הסרטון..."
              className="text-sm h-20"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">משוב</Label>
            <Textarea
              value={formData.feedback}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              placeholder="משוב הרופא הבכיר..."
              className="text-sm h-20"
            />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Checkbox
              checked={formData.presented_in_meeting}
              onCheckedChange={(checked) => setFormData({ ...formData, presented_in_meeting: !!checked })}
            />
            <Label className="text-sm cursor-pointer">הוצג בישיבת שמיים</Label>
          </div>

          {formData.presented_in_meeting && (
            <div className="space-y-1.5">
              <Label className="text-xs">תאריך ישיבת שמיים</Label>
              <Popover open={meetingCalendarOpen} onOpenChange={setMeetingCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-sm">
                    <CalendarIcon className="w-4 h-4 ml-2" />
                    {format(meetingDateObj, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={meetingDateObj} onSelect={(d) => { if (d) { setMeetingDateObj(d); setMeetingCalendarOpen(false); } }} />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">הערות</Label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="הערות נוספות..."
              className="text-sm"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="gap-1.5">
              <Save className="w-4 h-4" />
              {initialData ? "עדכן" : "שמור"}
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