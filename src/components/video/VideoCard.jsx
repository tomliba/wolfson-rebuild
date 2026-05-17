import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Film, Pencil, Trash2, Presentation } from "lucide-react";

export default function VideoCard({ review, onEdit, onDelete, isAdmin }) {
  return (
    <Card className="p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Film className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              {format(new Date(review.review_date), 'dd/MM/yyyy')}
            </span>
            {review.senior_doctor && (
              <span className="text-xs text-muted-foreground">
                עם ד״ר {review.senior_doctor}
              </span>
            )}
            {review.presented_in_meeting && (
              <Badge className="text-[10px] bg-accent/10 text-accent border-0 gap-1">
                <Presentation className="w-3 h-3" />
                הוצג בישיבת שמיים
                {review.meeting_date && ` (${format(new Date(review.meeting_date), 'dd/MM/yyyy')})`}
              </Badge>
            )}
          </div>

          {review.video_description && (
            <p className="text-xs text-foreground mb-1">{review.video_description}</p>
          )}

          {review.feedback && (
            <p className="text-xs text-muted-foreground mt-1">💬 {review.feedback}</p>
          )}

          {review.notes && (
            <p className="text-xs text-muted-foreground mt-1">📝 {review.notes}</p>
          )}
        </div>

        {!isAdmin && (
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(review)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(review.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}