import { Icon } from './icons.jsx'

export default function ChoiceCard({ icon = 'leaf', label, selected, onClick }) {
  const IconComp = Icon[icon] || Icon.leaf
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 border-[1.5px] rounded-2xl px-4 py-4 font-semibold text-sm text-left transition
        ${selected ? 'border-brand bg-brand-tint' : 'border-black/10 bg-white'}`}
    >
      <IconComp className="w-5 h-5 text-brand flex-shrink-0" />
      <span>{label}</span>
      <span className={`ml-auto w-[18px] h-[18px] rounded-full border-[1.5px] ${selected ? 'bg-brand border-brand' : 'border-black/15'}`} />
    </button>
  )
}
