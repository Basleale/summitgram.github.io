"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Database,
  ExternalLink,
  Copy,
  Download,
  CheckCircle,
  ArrowRight,
  Key,
  Settings,
  AlertCircle,
  Home,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function SetupPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [envVars, setEnvVars] = useState({
    NEXT_PUBLIC_SUPABASE_URL: "https://bapopvijrrlfrtjjlpmh.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhcG9wdmlqcnJsZnJ0ampscG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxOTkxMDQsImV4cCI6MjA3Mjc3NTEwNH0.dkffH59rs_mn6qqJT96ReDbKe-495483VPAqMl_HMII",
    SUPABASE_SERVICE_ROLE_KEY:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhcG9wdmlqcnJsZnJ0ampscG1oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE5OTEwNCwiZXhwIjoyMDcyNzc1MTA0fQ.V71Jy2Zha0dwNsGY1aizH1IuNMjOx0fKh7x6H4_4GqE",
  })
  const { toast } = useToast()
  const router = useRouter()

  const handleEnvVarChange = (key: string, value: string) => {
    setEnvVars((prev) => ({ ...prev, [key]: value }))
  }

  const generateEnvFile = () => {
    return `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="${envVars.NEXT_PUBLIC_SUPABASE_URL}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY}"
SUPABASE_SERVICE_ROLE_KEY="${envVars.SUPABASE_SERVICE_ROLE_KEY}"

# Database Configuration (Optional - for direct database access)
POSTGRES_URL="postgres://postgres.bapopvijrrlfrtjjlpmh:ZFi77SSaeAVD4jwW@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"
POSTGRES_PRISMA_URL="postgres://postgres.bapopvijrrlfrtjjlpmh:ZFi77SSaeAVD4jwW@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgres://postgres.bapopvijrrlfrtjjlpmh:ZFi77SSaeAVD4jwW@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"

# Database Credentials
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="ZFi77SSaeAVD4jwW"
POSTGRES_HOST="db.bapopvijrrlfrtjjlpmh.supabase.co"
POSTGRES_DATABASE="postgres"

# JWT Secret (for advanced auth features)
SUPABASE_JWT_SECRET="1Rv7AeALCI6K5zWOQ06DTaZrUg3GeRSY0IdujeaTvB3EdSC9RGVT9zCfWiwqKF87oWHg6QUl7JtRF7oDDKNTOA=="
`
  }

  const downloadEnvFile = () => {
    const content = generateEnvFile()
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = ".env.local"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Environment file downloaded!",
      description: "Add this file to your project root directory.",
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard!",
      description: "Environment variables copied successfully.",
    })
  }

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1:
        return true // Always available
      case 2:
        return envVars.NEXT_PUBLIC_SUPABASE_URL && envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
      case 3:
        return (
          envVars.NEXT_PUBLIC_SUPABASE_URL && envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY && envVars.SUPABASE_SERVICE_ROLE_KEY
        )
      case 4:
        return isStepComplete(3)
      default:
        return false
    }
  }

  const steps = [
    { number: 1, title: "Project Ready", icon: CheckCircle },
    { number: 2, title: "API Keys", icon: Key },
    { number: 3, title: "Environment", icon: Settings },
    { number: 4, title: "Database", icon: Database },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Supabase Configuration</h1>
          </div>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Your Supabase project is ready! Follow these final steps to complete the setup and enable all features.
          </p>
        </div>

        {/* Success Banner */}
        <Card className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border-green-500/30 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-600/20 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-1">Supabase Project Created Successfully!</h3>
                <p className="text-slate-300">
                  Your project <strong>bapopvijrrlfrtjjlpmh</strong> is ready. Complete the setup below to start using
                  all features.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = isStepComplete(step.number)

              return (
                <div key={step.number} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                      isActive
                        ? "border-purple-500 bg-purple-500 text-white"
                        : isCompleted
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-slate-600 bg-slate-800 text-slate-400"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="ml-2 hidden sm:block">
                    <div className={`text-sm font-medium ${isActive ? "text-white" : "text-slate-400"}`}>
                      {step.title}
                    </div>
                  </div>
                  {index < steps.length - 1 && <ArrowRight className="h-4 w-4 text-slate-600 mx-4" />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          <Tabs value={currentStep.toString()} onValueChange={(value) => setCurrentStep(Number.parseInt(value))}>
            <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-700">
              {steps.map((step) => (
                <TabsTrigger
                  key={step.number}
                  value={step.number.toString()}
                  className="data-[state=active]:bg-slate-700"
                >
                  Step {step.number}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Step 1: Project Ready */}
            <TabsContent value="1" className="mt-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Supabase Project Ready
                  </CardTitle>
                  <CardDescription>
                    Great! Your Supabase project has been created and is ready for configuration.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-slate-700/50 p-4 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Project Details:</h4>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li>
                        • <strong>Project ID:</strong> bapopvijrrlfrtjjlpmh
                      </li>
                      <li>
                        • <strong>URL:</strong> https://bapopvijrrlfrtjjlpmh.supabase.co
                      </li>
                      <li>
                        • <strong>Region:</strong> US East (N. Virginia)
                      </li>
                      <li>
                        • <strong>Database:</strong> PostgreSQL 15
                      </li>
                      <li>
                        • <strong>Status:</strong> <Badge className="bg-green-600">Active</Badge>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-blue-600/20 border border-blue-500/30 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-300 mb-1">What's Next:</h4>
                        <ol className="text-sm text-blue-200 space-y-1">
                          <li>1. Configure your environment variables (Step 2)</li>
                          <li>2. Download and add the .env.local file (Step 3)</li>
                          <li>3. Create database tables (Step 4)</li>
                          <li>4. Start using your media dashboard!</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button onClick={() => setCurrentStep(2)} className="bg-purple-600 hover:bg-purple-700">
                      Continue to Configuration
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => window.open("https://bapopvijrrlfrtjjlpmh.supabase.co", "_blank")}
                      variant="outline"
                      className="border-slate-600 text-slate-300"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open Supabase Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Step 2: API Keys */}
            <TabsContent value="2" className="mt-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Keys Configuration
                  </CardTitle>
                  <CardDescription>Your API keys are pre-configured and ready to use.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-green-600/20 border border-green-500/30 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-300 mb-1">API Keys Ready!</h4>
                        <p className="text-sm text-green-200">
                          All your API keys have been automatically configured from your Supabase project.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="supabase-url" className="text-white">
                        Supabase URL
                      </Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="supabase-url"
                          value={envVars.NEXT_PUBLIC_SUPABASE_URL}
                          onChange={(e) => handleEnvVarChange("NEXT_PUBLIC_SUPABASE_URL", e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white"
                          readOnly
                        />
                        <Button
                          onClick={() => copyToClipboard(envVars.NEXT_PUBLIC_SUPABASE_URL)}
                          variant="outline"
                          className="border-slate-600"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="anon-key" className="text-white">
                        Anon/Public Key
                      </Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="anon-key"
                          value={envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY}
                          onChange={(e) => handleEnvVarChange("NEXT_PUBLIC_SUPABASE_ANON_KEY", e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white"
                          readOnly
                        />
                        <Button
                          onClick={() => copyToClipboard(envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY)}
                          variant="outline"
                          className="border-slate-600"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="service-key" className="text-white flex items-center gap-2">
                        Service Role Key
                        <Badge variant="destructive" className="text-xs">
                          Secret
                        </Badge>
                      </Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="service-key"
                          type="password"
                          value={envVars.SUPABASE_SERVICE_ROLE_KEY}
                          onChange={(e) => handleEnvVarChange("SUPABASE_SERVICE_ROLE_KEY", e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white"
                          readOnly
                        />
                        <Button
                          onClick={() => copyToClipboard(envVars.SUPABASE_SERVICE_ROLE_KEY)}
                          variant="outline"
                          className="border-slate-600"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">⚠️ Keep this secret! Only use in server-side code.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button onClick={() => setCurrentStep(3)} className="bg-purple-600 hover:bg-purple-700">
                      Continue to Environment Setup
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Step 3: Configure Environment */}
            <TabsContent value="3" className="mt-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Environment Configuration
                  </CardTitle>
                  <CardDescription>Download your complete environment file with all credentials.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-slate-700/50 p-4 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Complete .env.local file:</h4>
                    <pre className="text-sm text-slate-300 bg-slate-900 p-3 rounded overflow-x-auto max-h-64">
                      {generateEnvFile()}
                    </pre>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={downloadEnvFile} className="bg-green-600 hover:bg-green-700 flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      Download .env.local
                    </Button>
                    <Button
                      onClick={() => copyToClipboard(generateEnvFile())}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:text-white flex-1"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy to Clipboard
                    </Button>
                  </div>

                  <div className="bg-yellow-600/20 border border-yellow-500/30 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-300 mb-1">Setup Instructions:</h4>
                        <ol className="text-sm text-yellow-200 space-y-1">
                          <li>1. Download the .env.local file above</li>
                          <li>2. Place it in your project's root directory (same level as package.json)</li>
                          <li>
                            3. Restart your development server:{" "}
                            <code className="bg-slate-800 px-1 rounded">npm run dev</code>
                          </li>
                          <li>4. For production, add these variables to your hosting platform</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <Button onClick={() => setCurrentStep(4)} className="bg-purple-600 hover:bg-purple-700">
                    Continue to Database Setup
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Step 4: Setup Database */}
            <TabsContent value="4" className="mt-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Setup
                  </CardTitle>
                  <CardDescription>Create the necessary database tables for your media dashboard.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-slate-700/50 p-4 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Tables to be created:</h4>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li>
                        • <strong>users</strong> - User profiles and authentication data
                      </li>
                      <li>
                        • <strong>media</strong> - Media files metadata and information
                      </li>
                      <li>
                        • <strong>likes</strong> - User likes on media items
                      </li>
                      <li>
                        • <strong>comments</strong> - Comments on media items
                      </li>
                      <li>
                        • <strong>messages</strong> - Chat messages between users
                      </li>
                    </ul>
                  </div>

                  <div className="bg-green-600/20 border border-green-500/30 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-300 mb-1">Ready for Database Setup!</h4>
                        <p className="text-sm text-green-200">
                          Your environment is configured. Create the database tables to complete the setup.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={() => router.push("/setup-db")}
                      className="bg-purple-600 hover:bg-purple-700 flex-1"
                    >
                      <Database className="mr-2 h-4 w-4" />
                      Setup Database Tables
                    </Button>
                    <Button
                      onClick={() => router.push("/")}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:text-white flex-1"
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Go to Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-slate-400">
          <p className="text-sm">
            Need help? Check out the{" "}
            <a
              href="https://supabase.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300"
            >
              Supabase documentation
            </a>{" "}
            or{" "}
            <a
              href="https://github.com/supabase/supabase/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300"
            >
              community discussions
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
