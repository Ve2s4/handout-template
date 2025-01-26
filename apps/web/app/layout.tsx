import { Geist, Geist_Mono } from "next/font/google"

import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ClerkProvider } from "@clerk/nextjs";
import { SidebarProvider, SidebarTrigger } from "@workspace/ui/components/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {ToggleTheme} from "@/components/toggle-theme";
import {BreadcrumbNavigation} from "@/components/breadcrumb-navigation";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}
      >
      <ThemeProvider>
          <ClerkProvider>
              <SidebarProvider>
                  <AppSidebar />
                  <main className={'w-full'}>
                      <div className={'flex justify-between items-center w-full'}>
                          <div className={'flex justify-between items-center gap-3'}>
                              <SidebarTrigger />
                              <BreadcrumbNavigation/>
                          </div>
                          <ToggleTheme />
                      </div>
                      {children}
                  </main>
              </SidebarProvider>
          </ClerkProvider>
      </ThemeProvider>
      </body>
    </html>
  )
}
