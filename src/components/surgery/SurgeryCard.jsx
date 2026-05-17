import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Eye, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { getStepLabel, SURGERY_STEPS, PHACO_LASER_STEPS } from "../shared/SurgerySteps";

export default function SurgeryCard({ surgery, onEdit, onDelete, isAdmin }) {
  return (
    <Card className="p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-sm font-semibold text-foreground">
              {format(new Date(surgery.surgery_date), 'dd/MM/yyyy')}
            </span>
            <Badge variant="outline" className={`text-xs ${surgery.surgery_type === 'phacolaser' ? 'border-accent/40 text-accent' : 'border-primary/30 text-primary'}`}>
              {surgery.surgery_type === 'phacolaser' ? 'פאקולייזר' : 'פאקו'}
            </Badge>
            {surgery.patient_initials && (
              <Badge variant="secondary" className="text-xs">
                {surgery.patient_initials}
              </Badge>
            )}
            {surgery.eye && (
              <Badge variant="outline" className="text-xs gap-1">
                <Eye className="w-3 h-3" />
                {surgery.eye === 'right' ? 'ימין' : 'שמאל'}
              </Badge>
            )}
            {surgery.supervising_surgeon && (
              <span className="text-xs text-muted-foreground">
                מפקח: {surgery.supervising_surgeon}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {surgery.steps_performed?.map((step) => (
              <Badge key={step} className="text-[10px] bg-primary/10 text-primary border-0">
                {getStepLabel(step)}
              </Badge>
            ))}
          </div>

          {surgery.complications && surgery.complications !== "ללא" && (
            <div className="flex items-center gap-1 text-xs text-destructive mt-1">
              <AlertTriangle className="w-3 h-3" />
              {surgery.complications}
            </div>
          )}

          {surgery.notes && (
            <p className="text-xs text-muted-foreground mt-1">📝 {surgery.notes}</p>
          )}
        </div>

        {!isAdmin && (
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(surgery)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(surgery.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}