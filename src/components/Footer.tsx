import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">Proizvod</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link href="/features" className="text-gray-300 hover:text-white">
                  Funkcionalnosti
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-gray-300 hover:text-white">
                  Cenovnik
                </Link>
              </li>
              <li>
                <Link href="/templates" className="text-gray-300 hover:text-white">
                  Šabloni
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">Kompanija</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white">
                  O nama
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-gray-300 hover:text-white">
                  Karijera
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white">
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">Pravno</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-white">
                  Politika privatnosti
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-white">
                  Uslovi korišćenja
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-700 pt-8">
          <p className="text-base text-gray-400 xl:text-center">&copy; 2023 LegalEase. Sva prava zadržana.</p>
        </div>
      </div>
    </footer>
  )
}

