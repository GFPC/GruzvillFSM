"use client"

import { useState } from "react"
import { RoleEmulator } from "@/components/role-emulator"
import { ParcelLockerSchema } from "@/components/parcel-locker-schema"
import { TestQueue } from "@/components/test-queue"
import { LogsPanel } from "@/components/logs-panel"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { LanguageProvider, useLanguage } from "@/lib/language-context"
import { Button } from "@/components/ui/button"

function TestInterfaceContent() {
  const [logs, setLogs] = useState<any[]>([])
  const [currentTest, setCurrentTest] = useState<any>(null)
  const [currentMode, setCurrentMode] = useState<"create" | "run">("create")
  const [activeTab, setActiveTab] = useState<string>("client")
  const { language, setLanguage, t } = useLanguage()

  const addLog = (log: any) => {
    setLogs((prev) => [...prev, { ...log, step: prev.length + 1, timestamp: new Date().toISOString() }])
  }

  return (
    <div className="h-screen w-full bg-background">
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{t.header.title}</h1>
            <p className="text-sm text-muted-foreground">{t.header.subtitle}</p>
          </div>
          <div className="flex gap-2">
            <Button variant={language === "en" ? "default" : "outline"} size="sm" onClick={() => setLanguage("en")}>
              EN
            </Button>
            <Button variant={language === "ru" ? "default" : "outline"} size="sm" onClick={() => setLanguage("ru")}>
              RU
            </Button>
          </div>
        </div>
      </header>

      <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-88px)]">
        <ResizablePanel defaultSize={40} minSize={30}>
          <RoleEmulator
            addLog={addLog}
            currentTest={currentTest}
            onModeChange={setCurrentMode}
            onTabChange={setActiveTab}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={25} minSize={20}>
          <ParcelLockerSchema mode={currentMode} activeTab={activeTab} addLog={addLog} />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={35} minSize={25}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={45} minSize={30}>
              <TestQueue setCurrentTest={setCurrentTest} addLog={addLog} />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={55} minSize={30}>
              <LogsPanel logs={logs} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default function TestInterface() {
  return (
    <LanguageProvider>
      <TestInterfaceContent />
    </LanguageProvider>
  )
}
