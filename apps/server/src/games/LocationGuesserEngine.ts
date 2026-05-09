import { RoomState } from '@tab-arcade/shared';


const LOCATIONS = [
  { 
    id: '1887368381696091', 
    lat: 27.17493959690613, 
    lng: 78.04226229866492, 
    name: "Taj Mahal, Agra" 
  },
 { 
    id: '1887368381696091', 
    lat: 27.17493959690613, 
    lng: 78.04226229866492, 
    name: "Taj Mahal, Agra" 
  },
  { 
    id: '1887368381696091', 
    lat: 27.17493959690613, 
    lng: 78.04226229866492, 
    name: "Taj Mahal, Agra" 
  },
  { 
    id: '1887368381696091', 
    lat: 27.17493959690613, 
    lng: 78.04226229866492, 
    name: "Taj Mahal, Agra" 
  },
];

// Haversine formula to calculate distance in Kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export const LocationGuesserEngine = {
initGame: (room: RoomState) => {
    const randomLoc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    
    // Create the state
    const newState = {
      phase: 'guessing',
      targetLocation: randomLoc,
      guesses: {},
      scores: {} as Record<string, number>
    };
    
    room.players.forEach(p => newState.scores[p.id] = 0);

    // YOU MUST RETURN IT SO index.ts CAN ASSIGN IT
    return newState;
  },

 handleAction: (room: RoomState, playerId: string, action: string, payload?: any) => {
    const state = room.gameState;
    if (!state) return;

    if (action === 'submit_guess' && state.phase === 'guessing') {
      const { lat, lng } = payload;
      const target = state.targetLocation;
      
      const distanceKm = calculateDistance(lat, lng, target.lat, target.lng);
      const points = Math.max(0, Math.floor(5000 * Math.exp(-distanceKm / 2000)));

      // Save the player's guess
      state.guesses[playerId] = { lat, lng, distance: distanceKm, points };

      // CHECK IF ALL PLAYERS HAVE GUESSED
      if (Object.keys(state.guesses).length === room.players.length) {
        state.phase = 'results'; // Switch to results phase!
        
        // Add points to the global scores
        Object.entries(state.guesses).forEach(([pid, guess]: any) => {
          if (state.scores[pid] !== undefined) {
             state.scores[pid] += guess.points;
          }
        });
      }
    }

    if (action === 'next_round' && state.phase === 'results') {
       const newLoc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
       state.targetLocation = newLoc;
       state.guesses = {};
       state.phase = 'guessing';
    }
  }
};