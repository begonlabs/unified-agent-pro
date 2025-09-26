import React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

interface MobileSidebarProps {
  isOpen: boolean;
  isMenuActive: boolean;
  onToggle: () => void;
  onMenuActivate: () => void;
  children: React.ReactNode;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  isMenuActive,
  onToggle,
  onMenuActivate,
  children
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={onToggle}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={onMenuActivate}
          className={`fixed top-2 left-0 z-50 lg:hidden shadow-lg hover:shadow-xl rounded-l-none rounded-r-lg p-2 transition-all duration-300 ${
            isMenuActive 
              ? 'bg-white opacity-100' 
              : 'bg-white/70 opacity-70 hover:opacity-100'
          }`}
        >
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64">
        {children}
      </SheetContent>
    </Sheet>
  );
};
