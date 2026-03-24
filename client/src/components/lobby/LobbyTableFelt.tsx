import type { RoomState } from '@shared/types.js';
import type { GameType } from '@shared/rules.js';

export interface LobbyTableSettings {
  maxPlayers: number;
  gameType: GameType;
  targetScore: number;
  turnTimeout: number;
}

type Props = {
  isHost: boolean;
  room: RoomState;
  settings: LobbyTableSettings;
  maxSeats: number;
  onUpdateSetting: (patch: Partial<LobbyTableSettings>) => void;
  onGameTypeChange: (type: GameType) => void;
};

/**
 * Lobby table preview — isolated component so parent re-renders don’t remount the felt
 * and layout stays stable when toggling target score / players.
 */
export function LobbyTableFelt({
  isHost,
  room,
  settings,
  maxSeats,
  onUpdateSetting,
  onGameTypeChange,
}: Props) {
  return (
    <div
      className="relative rounded-[32px] sm:rounded-[40px] border-[2px] sm:border-[4px] border-brass/20 overflow-hidden w-full min-h-[360px] sm:min-h-[380px] flex flex-col"
      style={{
        background:
          'radial-gradient(ellipse at 50% 40%, rgba(58, 107, 53, 0.95) 0%, rgba(45, 84, 41, 0.98) 60%, rgba(30, 58, 28, 1) 100%)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.8), inset 0 0 60px rgba(0,0,0,0.8)',
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg width=\'4\' height=\'4\' viewBox=\'0 0 4 4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\' fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
        }}
      />
      <div className="absolute inset-0 rounded-[30px] sm:rounded-[36px] pointer-events-none border border-white/10" />

      <div className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-8 py-6 sm:py-8 gap-6 sm:gap-8 flex-1 min-h-0">
        {isHost ? (
          <>
            <div className="w-full max-w-[280px] shrink-0">
              <div className="text-cream/50 font-ancient text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-center mb-3 font-bold">
                Game Mode
              </div>
              <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5 shadow-inner-dark">
                {(['chkobba', 'rummy'] as GameType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onGameTypeChange(type)}
                    className={`flex-1 py-2 sm:py-3 font-ancient text-sm sm:text-base font-bold uppercase tracking-widest transition-colors duration-200 rounded-lg transform-gpu ${
                      settings.gameType === type
                        ? 'bg-gradient-to-b from-brass-light to-brass-dark text-black shadow-glow-gold'
                        : 'bg-transparent text-cream/40 hover:text-cream/80 hover:bg-white/5'
                    }`}
                  >
                    {type === 'chkobba' ? 'Chkobba' : 'Rummy'}
                  </button>
                ))}
              </div>
            </div>

            {/* Fixed-height slot so target score toggles don’t resize the card */}
            <div
              className="w-full max-w-[280px] shrink-0 min-h-[118px] flex flex-col justify-end"
              aria-hidden={settings.gameType !== 'chkobba'}
            >
              {settings.gameType === 'chkobba' ? (
                <>
                  <div className="text-cream/50 font-ancient text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-center mb-3 font-bold">
                    Target Score
                  </div>
                  <div className="flex justify-center gap-4 sm:gap-5">
                    {[11, 21, 31].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => onUpdateSetting({ targetScore: s })}
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl font-ancient font-bold text-sm sm:text-base border-2 transition-colors duration-200 transform-gpu will-change-transform hover:brightness-110 active:brightness-95 ${
                          settings.targetScore === s
                            ? 'bg-gradient-to-b from-brass-light to-brass-dark text-black border-brass-light shadow-glow-gold'
                            : 'bg-black/40 text-cream/40 border-white/10 hover:border-brass/30 hover:bg-black/60 shadow-inner-dark'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-full min-h-[80px]" />
              )}
            </div>

            <div className="w-full max-w-[280px] shrink-0">
              <div className="text-cream/50 font-ancient text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-center mb-3 font-bold">
                Players
              </div>
              {settings.gameType === 'chkobba' ? (
                <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5 max-w-[220px] mx-auto shadow-inner-dark">
                  {[{ n: 2, label: '1 vs 1' }, { n: 4, label: '2 vs 2' }].map(({ n, label }) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onUpdateSetting({ maxPlayers: n })}
                      className={`flex-1 py-1.5 sm:py-2.5 font-ancient text-xs sm:text-sm font-bold tracking-widest transition-colors duration-200 rounded-lg ${
                        settings.maxPlayers === n
                          ? 'bg-gradient-to-b from-brass-light to-brass-dark text-black shadow-glow-gold'
                          : 'bg-transparent text-cream/40 hover:text-cream/80 hover:bg-white/5'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center gap-3 sm:gap-4">
                  {[2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onUpdateSetting({ maxPlayers: n })}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl font-ancient font-bold text-sm sm:text-base border-2 transition-colors duration-200 transform-gpu hover:brightness-110 ${
                        settings.maxPlayers === n
                          ? 'bg-gradient-to-b from-brass-light to-brass-dark text-black border-brass-light shadow-glow-gold'
                          : 'bg-black/40 text-cream/40 border-white/10 hover:border-brass/30 hover:bg-black/60 shadow-inner-dark'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {settings.gameType === 'chkobba' && (
              <div className="w-full max-w-[280px] shrink-0">
                <div className="text-cream/50 font-ancient text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-center mb-3 font-bold">
                  Turn Timeout
                </div>
                <div className="flex justify-center gap-2 flex-wrap">
                  {[{ v: 0, label: 'Off' }, { v: 30, label: '30s' }, { v: 60, label: '60s' }, { v: 90, label: '90s' }, { v: 120, label: '2m' }].map(({ v, label }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => onUpdateSetting({ turnTimeout: v })}
                      className={`px-3 py-1.5 rounded-lg font-ancient font-bold text-[10px] sm:text-[11px] border transition-colors duration-200 ${
                        settings.turnTimeout === v
                          ? 'bg-gradient-to-b from-brass-light to-brass-dark text-black border-brass-light shadow-glow-gold'
                          : 'bg-black/40 text-cream/40 border-white/10 hover:border-brass/30 hover:bg-white/5 shadow-inner-dark'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-brass-light to-brass-dark font-ancient text-xl sm:text-2xl uppercase tracking-[0.3em] font-extrabold drop-shadow-md">
              {room.gameType === 'chkobba' ? 'Chkobba' : 'Rummy'}
            </span>
            {room.gameType === 'chkobba' && (
              <span className="text-cream/60 font-ancient text-sm tracking-widest bg-black/40 px-4 py-1 rounded-full border border-white/5">
                Target: {room.targetScore} pts
              </span>
            )}
            <span className="text-cream/40 font-ancient text-xs uppercase tracking-widest mt-2">
              {room.players.length}/{maxSeats} players joined
            </span>
            <span className="text-cream/30 font-ancient text-[10px] italic mt-4 animate-pulse">
              Waiting for host to start...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
