import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Clock, Truck, ArrowRight } from "lucide-react";
import { format, addDays, isBefore, startOfToday } from "date-fns";
import { cn } from "@/lib/utils";

export interface DeliverySlot {
  date: Date;
  timeSlot: string;
}

interface DeliveryStepProps {
  selectedDelivery: DeliverySlot | null;
  onSelect: (delivery: DeliverySlot) => void;
}

const timeSlots = [
  { id: "morning", label: "Morning", time: "9:00 AM - 12:00 PM", icon: "🌅" },
  { id: "afternoon", label: "Afternoon", time: "12:00 PM - 4:00 PM", icon: "☀️" },
  { id: "evening", label: "Evening", time: "4:00 PM - 8:00 PM", icon: "🌆" },
];

export function DeliveryStep({ selectedDelivery, onSelect }: DeliveryStepProps) {
  const [date, setDate] = useState<Date | undefined>(selectedDelivery?.date);
  const [timeSlot, setTimeSlot] = useState<string>(selectedDelivery?.timeSlot || "");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const today = startOfToday();
  const minDate = addDays(today, 2); // Minimum 2 days from today
  const maxDate = addDays(today, 30); // Maximum 30 days from today

  const handleContinue = () => {
    if (date && timeSlot) {
      onSelect({ date, timeSlot });
    }
  };

  const disabledDays = (day: Date) => {
    return isBefore(day, minDate) || isBefore(maxDate, day);
  };

  const getSelectedTimeSlotLabel = () => {
    const slot = timeSlots.find(s => s.id === timeSlot);
    return slot ? `${slot.label} (${slot.time})` : "";
  };

  return (
    <Card variant="elevated" className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Truck className="h-6 w-6 text-primary" />
        <h2 className="font-display text-xl font-semibold">
          Select Delivery Date & Time
        </h2>
      </div>

      <p className="text-muted-foreground mb-6">
        Choose your preferred delivery date and time slot. Orders are typically delivered within the selected window.
      </p>

      {/* Date Selection */}
      <div className="mb-8">
        <Label className="text-base font-medium mb-3 block">
          <CalendarIcon className="h-4 w-4 inline mr-2" />
          Delivery Date
        </Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal h-12",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "EEEE, MMMM d, yyyy") : "Select a delivery date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => {
                setDate(newDate);
                setCalendarOpen(false);
              }}
              disabled={disabledDays}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground mt-2">
          Available dates: {format(minDate, "MMM d")} - {format(maxDate, "MMM d, yyyy")}
        </p>
      </div>

      {/* Time Slot Selection */}
      <div className="mb-8">
        <Label className="text-base font-medium mb-3 block">
          <Clock className="h-4 w-4 inline mr-2" />
          Time Slot
        </Label>
        <RadioGroup
          value={timeSlot}
          onValueChange={setTimeSlot}
          className="grid gap-3"
        >
          {timeSlots.map((slot) => (
            <Label
              key={slot.id}
              htmlFor={slot.id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                timeSlot === slot.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <RadioGroupItem value={slot.id} id={slot.id} />
              <span className="text-2xl">{slot.icon}</span>
              <div className="flex-1">
                <p className="font-medium">{slot.label}</p>
                <p className="text-sm text-muted-foreground">{slot.time}</p>
              </div>
            </Label>
          ))}
        </RadioGroup>
      </div>

      {/* Selected Summary */}
      {date && timeSlot && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-primary mb-1">Selected Delivery:</p>
          <p className="font-medium">
            {format(date, "EEEE, MMMM d, yyyy")}
          </p>
          <p className="text-sm text-muted-foreground">
            {getSelectedTimeSlotLabel()}
          </p>
        </div>
      )}

      <Button
        variant="hero"
        size="lg"
        className="w-full"
        onClick={handleContinue}
        disabled={!date || !timeSlot}
      >
        Continue to Payment
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </Card>
  );
}
