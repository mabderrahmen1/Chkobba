/**
 * Full rules / FAQ copy for the landing "Règles du jeu" modal (French, SEO-friendly).
 */
export function ChkobbaRulesContent() {
  return (
    <div className="text-left space-y-10 pt-2">
      <div>
        <h2 className="text-2xl sm:text-3xl font-ancient text-brass text-center mb-6">Comment jouer à la Chkobba ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel-heavy p-5 rounded-2xl border-brass/10">
            <div className="text-brass font-ancient text-xl mb-2">01.</div>
            <h3 className="text-lg text-cream font-bold mb-2">La Distribution</h3>
            <p className="text-cream/60 text-sm leading-relaxed">
              Chaque joueur reçoit 3 cartes, et 4 cartes sont posées face visible sur la table. Le jeu se joue avec un jeu de 40 cartes traditionnel.
            </p>
          </div>
          <div className="glass-panel-heavy p-5 rounded-2xl border-brass/10">
            <div className="text-brass font-ancient text-xl mb-2">02.</div>
            <h3 className="text-lg text-cream font-bold mb-2">La Capture</h3>
            <p className="text-cream/60 text-sm leading-relaxed">
              À votre tour, jouez une carte. Si sa valeur correspond à une carte sur la table ou à la somme de plusieurs cartes, vous les capturez.
            </p>
          </div>
          <div className="glass-panel-heavy p-5 rounded-2xl border-brass/10">
            <div className="text-brass font-ancient text-xl mb-2">03.</div>
            <h3 className="text-lg text-cream font-bold mb-2">La Chkobba</h3>
            <p className="text-cream/60 text-sm leading-relaxed">
              Si vous capturez la dernière carte de la table, vous faites une &quot;Chkobba&quot; et gagnez un point supplémentaire immédiat.
            </p>
          </div>
        </div>
      </div>

      <section className="glass-panel-heavy p-6 sm:p-8 rounded-3xl border-brass/10 space-y-6">
        <h2 className="text-2xl font-ancient text-brass">Règles de la Chkobba : le décompte des points</h2>
        <p className="text-cream/70 text-sm leading-relaxed">
          Pour gagner à la Chkobba en ligne sur chkobba.app, vous devez atteindre le score cible de la table (souvent 21 points). Voici comment les points sont calculés à la fin de chaque manche :
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { title: 'Carta (les cartes)', body: "L'équipe qui a capturé plus de 20 cartes gagne 1 point." },
            { title: 'Dinari (les carreaux)', body: "L'équipe qui a plus de 5 cartes de carreau gagne 1 point." },
            { title: 'Bermila (les sept)', body: "L'équipe qui a le plus de 7 (ou de 6 en cas d'égalité) gagne 1 point." },
            { title: 'Sabaa El Haya (7 de carreau)', body: 'Le joueur qui capture le 7 de carreau gagne automatiquement 1 point.' },
          ].map((row) => (
            <div key={row.title} className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-brass/20 flex items-center justify-center flex-shrink-0 text-brass font-bold text-sm">1</div>
              <div>
                <h4 className="text-cream font-bold text-sm">{row.title}</h4>
                <p className="text-cream/50 text-xs mt-0.5">{row.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-ancient text-brass text-center">Foire aux questions (FAQ)</h2>
        <div className="space-y-3">
          {[
            {
              q: 'Peut-on jouer à la Chkobba en ligne gratuitement ?',
              a: 'Oui, sur chkobba.app, vous pouvez jouer gratuitement sans inscription et sans téléchargement.',
            },
            {
              q: 'Comment jouer avec des amis à distance ?',
              a: "Il suffit de créer une table, de copier le code de la chambre et de l'envoyer à vos amis pour qu'ils rejoignent votre partie en temps réel.",
            },
            {
              q: 'Le jeu est-il disponible sur mobile ?',
              a: 'Absolument. Chkobba.app est une Web App optimisée pour tous les navigateurs mobiles, iPhone et Android.',
            },
            {
              q: 'Quelles sont les différences entre Chkobba et Scopa ?',
              a: 'La Chkobba est la variante tunisienne de la Scopa italienne. Les règles de base sont identiques, mais le décompte des points (Carta, Dinari, Bermila) est spécifique à la tradition tunisienne.',
            },
            {
              q: "Peut-on jouer contre l'ordinateur (bot) ?",
              a: 'Oui, vous pouvez ajouter des bots à votre table pour vous entraîner ou compléter une partie si vous êtes seul.',
            },
          ].map((item) => (
            <details key={item.q} className="glass-panel-heavy p-4 rounded-2xl border-brass/10 group cursor-pointer">
              <summary className="text-cream font-bold text-sm list-none flex justify-between items-center gap-2">
                {item.q}
                <span className="text-brass group-open:rotate-180 transition-transform shrink-0">↓</span>
              </summary>
              <p className="mt-3 text-cream/60 text-sm">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
