import logo from '../../../frontend/src/assets/logo/logo-transparent.png'
import BurgerMenuNav from './BurgerMenuNav'

function Nav() {
  return (
    <div className="px-4 py-2.5 bg-white border-b border-[#E8E6DA] sticky top-0 z-20">
      <div className="flex flex-row justify-between items-center">

        {/* Left: Burger + Logo */}
        <div className="flex flex-row items-center gap-3">
        <BurgerMenuNav />

          {/* Logo */}
          <div className="w-10 h-10 rounded-xl bg-white overflow-hidden flex items-center justify-center">
            <img src={logo} width="50" height="50" alt="Logo" />
          </div>
        </div>

        {/* Share Button */}
        <button
          className="
            px-3 py-2 rounded-xl text-sm font-medium flex flex-row items-center gap-1.5 text-[#F6F4E8] bg-[#333] relative overflow-hidden transition-all duration-250 ease-in-out hover:bg-[#A2CB8B] hover:shadow-md hover:scale-[1.03] active:scale-[0.97] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A2CB8B]
          "
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>

            Share
        </button>
      </div>
    </div>
  )
}

export default Nav