import Image from 'next/image'
import { JOB_LABELS } from '@/const/JobLabels'
import type { Character, PartySlotCharacter } from '@/types'

interface CharacterCardProps {
  character: Character | PartySlotCharacter
  onRemove?: (e: React.MouseEvent) => void
}

export function CharacterCard({ character, onRemove }: CharacterCardProps) {
  if (!character) return null

  return (
    <>
      <div className="w-8 h-8 relative mr-3 shrink-0">
        <Image
          src={`/icons/jobs/${character.job}.png`}
          alt={character.job || 'job'}
          fill
          sizes="32px"
          className={`object-cover pointer-events-none transition-all duration-300 ease-out ${onRemove ? 'group-hover:opacity-0 group-hover:scale-50 group-hover:rotate-12' : ''}`}
        />
        {onRemove && (
          <button
            className="absolute inset-0 w-full h-full bg-red-500/90 hover:bg-red-600 text-white rounded-lg flex items-center justify-center opacity-0 scale-50 -rotate-12 group-hover:opacity-100 group-hover:scale-100 group-hover:rotate-0 transition-all duration-300 ease-out shadow-inner z-10 text-xl leading-none pb-0.5"
            title="Remove Member"
            onClick={onRemove}
          >
            ×
          </button>
        )}
      </div>
      <div className="min-w-0 flex-1 pointer-events-none">
        <div
          className="font-semibold text-sm truncate transition-colors"
          style={{ color: 'var(--text-primary)' }}
        >
          {character.name}
        </div>
        <div
          className="text-xs flex justify-between pr-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span className="truncate max-w-[80px]">
            {JOB_LABELS[character.job as keyof typeof JOB_LABELS] || character.job}
          </span>
          <span className="font-medium text-amber-400">
            {Math.round(Number(character.pvp_score || 0)).toLocaleString()}
          </span>
        </div>
      </div>
    </>
  )
}
