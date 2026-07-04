/* eslint-disable @next/next/no-img-element */
// Os três naipes das clareiras (raposa, coelho, rato), como no baralho do jogo
export function SuitRow() {
  return (
    <div aria-hidden className="flex items-center gap-2">
      {["fox", "rabbit", "mouse"].map((suit) => (
        <img
          key={suit}
          src={`/art/suit-${suit}.webp`}
          alt=""
          className="size-8 drop-shadow-sm"
        />
      ))}
    </div>
  );
}
