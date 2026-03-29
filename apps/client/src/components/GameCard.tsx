import { Play } from 'lucide-react';

interface GameCardProps {
  title: string;
  description: string;
  players: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

export function GameCard({ title, description, players, icon, onClick }: GameCardProps) {
  return (
    <div 
      onClick={onClick}
      className="group flex flex-col p-6 bg-surface rounded-2xl border border-border cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-soft"
    >
      <div className="w-12 h-12 bg-bg rounded-xl flex items-center justify-center text-textMain mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-1">{title}</h3>
      <p className="text-textMuted text-sm mb-4 flex-grow">{description}</p>
      
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
        <span className="text-xs font-medium text-textMuted">{players} PLAYERS</span>
        <div className="flex items-center text-sm font-bold text-accent opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
          Select <Play className="w-4 h-4 ml-1" />
        </div>
      </div>
    </div>
  );
}