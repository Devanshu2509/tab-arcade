import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Polyline } from 'react-leaflet';
import { Home, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon issue in React
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
L.Marker.prototype.options.icon = L.icon({ iconUrl: icon, shadowUrl: iconShadow });

interface Props {
  room: any;
  me: any;
  sendAction: (type: string, payload?: any) => void;
}

export function LocationGuesser({ room, me, sendAction }: Props) {
  if (!room.gameState) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] text-textMuted">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p>Loading map data...</p>
      </div>
    );
  }

  const { phase, targetLocation, guesses, scores } = room.gameState;
  const [myGuess, setMyGuess] = useState<[number, number] | null>(null);

  // Handle map clicks to drop pin
  const MapClicker = () => {
    useMapEvents({
      click(e) {
        if (phase === 'guessing') setMyGuess([e.latlng.lat, e.latlng.lng]);
      }
    });
    return null;
  };

  const submitGuess = () => {
    if (myGuess) {
      sendAction('submit_guess', { lat: myGuess[0], lng: myGuess[1] });
    }
  };

  // Get Mapillary Client Token from .env
  const mapillaryToken = import.meta.env.VITE_MAPILLARY_CLIENT_TOKEN;
//   console.log(`https://www.mapillary.com/embed?image_key=${targetLocation.id}&style=photo&clientToken=${mapillaryToken}`);

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 h-[calc(100vh-120px)] w-full max-w-[1400px] mx-auto">
      {/* LEFT: Mapillary Street View (Bulletproof iFrame) */}
      <div className="flex-1 rounded-2xl overflow-hidden shadow-lg border-2 border-border relative bg-surface">
        {targetLocation?.id ? (
          <iframe
  src={`https://www.mapillary.com/embed?image_key=${targetLocation.id}&style=photo&clientToken=${mapillaryToken}`}
  frameBorder="0"
  className="w-full h-full bg-surface"
  // Add xr-spatial-tracking to stop the console warning
  allow="fullscreen; xr-spatial-tracking"
  title="Mapillary Street View"
></iframe>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-textMuted" size={32} />
          </div>
        )}
        
        {guesses[me.id] && phase === 'guessing' && (
          <div className="absolute top-4 left-4 bg-black/80 text-white px-4 py-2 rounded-lg z-10 font-bold tracking-wide">
            Guess Locked! Waiting for others...
          </div>
        )}
      </div>

      {/* RIGHT: Leaflet Map & Controls */}
      <div className="flex-[0.6] flex flex-col gap-4">
        <div className="flex-1 rounded-2xl overflow-hidden shadow-lg border-2 border-border relative z-0">
          <MapContainer 
            center={[20, 0]} 
            zoom={2} 
            className="w-full h-full absolute inset-0"
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapClicker />
            
            {myGuess && <Marker position={myGuess} />}
            
            {phase === 'results' && (
              <>
                <Marker position={[targetLocation.lat, targetLocation.lng]} />
                {Object.values(guesses).map((g: any, i) => (
                  <Polyline key={i} positions={[[g.lat, g.lng], [targetLocation.lat, targetLocation.lng]]} color="#ea580c" weight={3} dashArray="5, 10" />
                ))}
              </>
            )}
          </MapContainer>
        </div>

        {/* Action Bar */}
        <div className="bg-surface p-4 rounded-xl border border-border shadow-sm flex justify-between items-center">
          {phase === 'guessing' ? (
            <button 
              onClick={submitGuess}
              disabled={!myGuess || !!guesses[me.id]}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-bold w-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Lock Guess
            </button>
          ) : (
            <div className="w-full">
              <h3 className="font-bold text-lg mb-2 text-textMain">You were {Math.round(guesses[me.id]?.distance || 0)}km away! <span className="text-emerald-600">(+{guesses[me.id]?.points || 0} pts)</span></h3>
              {me.isHost && (
                <div className="flex gap-2 mt-4">
                  <button onClick={() => sendAction('next_round')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold transition-colors">Next Round</button>
                  <button onClick={() => sendAction('back_to_lobby')} className="px-5 py-3 bg-zinc-100 hover:bg-zinc-200 border border-border rounded-lg transition-colors"><Home size={20}/></button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}