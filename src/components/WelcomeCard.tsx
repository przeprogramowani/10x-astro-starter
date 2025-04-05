import { memo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export const WelcomeCard = memo(function WelcomeCard() {
  return (
    <Card className="max-w-4xl w-full bg-gradient-to-b from-white/10 to-white/5 border border-white/10 shadow-2xl rounded-2xl mx-auto">
      <CardHeader className="text-center space-y-2 p-8">
        <CardTitle className="text-6xl font-bold bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 text-transparent bg-clip-text drop-shadow-lg">
          Witaj w 10xDevs Astro Starter!
        </CardTitle>
        <CardDescription className="text-xl text-blue-100/90 drop-shadow-md">
          Ten projekt został zbudowany w oparciu o nowoczesny stack technologiczny:
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 px-8">
        <div className="grid gap-6 grid-rows-3">
          {/* Core */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
              Core
            </h2>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center space-x-3">
                <span className="font-mono bg-blue-900/50 px-3 py-1.5 rounded-lg text-blue-200 shadow-sm">
                  Astro v5.5.5
                </span>
                <span className="text-blue-100/90">- Metaframework do aplikacji webowych</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="font-mono bg-blue-900/50 px-3 py-1.5 rounded-lg text-blue-200 shadow-sm">
                  React v19
                </span>
                <span className="text-blue-100/90">- Biblioteka UI do komponentów interaktywnych</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="font-mono bg-blue-900/50 px-3 py-1.5 rounded-lg text-blue-200 shadow-sm">
                  TypeScript
                </span>
                <span className="text-blue-100/90">- Typowanie statyczne</span>
              </li>
            </ul>
          </div>

          {/* Stylowanie */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
              UI
            </h2>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center space-x-3">
                <span className="font-mono bg-blue-900/50 px-3 py-1.5 rounded-lg text-blue-200 shadow-sm">
                  Tailwind CSS v4
                </span>
                <span className="text-blue-100/90">- Utility-first CSS framework</span>
              </li>
            </ul>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center space-x-3">
                <span className="font-mono bg-blue-900/50 px-3 py-1.5 rounded-lg text-blue-200 shadow-sm">
                  Shadcn UI
                </span>
                <span className="text-blue-100/90">- Komponenty UI</span>
              </li>
            </ul>
          </div>

          {/* Statyczna analiza kodu */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
              Statyczna analiza kodu
            </h2>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center space-x-3">
                <span className="font-mono bg-blue-900/50 px-3 py-1.5 rounded-lg text-blue-200 shadow-sm">
                  ESLint v9
                </span>
                <span className="text-blue-100/90">- Lintowanie kodu</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="font-mono bg-blue-900/50 px-3 py-1.5 rounded-lg text-blue-200 shadow-sm">
                  Prettier
                </span>
                <span className="text-blue-100/90">- Formatowanie kodu</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="font-mono bg-blue-900/50 px-3 py-1.5 rounded-lg text-blue-200 shadow-sm">
                  Husky i Lint-staged
                </span>
                <span className="text-blue-100/90">- Automatyczna analiza kodu przed commitowaniem</span>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
