import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface ResponseTimeSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export const ResponseTimeSlider: React.FC<ResponseTimeSliderProps> = ({
  value,
  onChange
}) => {
  return (
    <div>
      <Label htmlFor="response-time" className="text-sm sm:text-base">
        Tiempo de Respuesta (segundos)
      </Label>
      <div className="mt-2">
        <Slider
          value={[value]}
          onValueChange={(values) => onChange(values[0])}
          max={300}
          min={5}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-xs sm:text-sm text-gray-500 mt-1">
          <span>5s (Inmediato)</span>
          <span className="font-medium">{value}s</span>
          <span>300s (5 min)</span>
        </div>
      </div>
      <p className="text-xs sm:text-sm text-gray-500 mt-2">
        Tiempo que espera la IA antes de responder automáticamente
      </p>
    </div>
  );
};
