import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Check, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

export default function CapacitorSetup() {
    const [copiedCode, setCopiedCode] = useState(null);

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedCode(id);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const CodeBlock = ({ code, id, title }) => (
        <div className="relative">
            {title && <p className="text-sm font-semibold mb-2 text-gray-700">{title}</p>}
            <div className="bg-gray-900 rounded-lg p-4 relative">
                <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 text-gray-400 hover:text-white"
                    onClick={() => copyToClipboard(code, id)}
                >
                    {copiedCode === id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <pre className="text-sm text-gray-100 overflow-x-auto">
                    <code>{code}</code>
                </pre>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        FuelFlow Pro - Android APK Setup Guide
                    </h1>
                    <p className="text-lg text-gray-600">
                        Phase 1: Converting your web app to a native Android application using Capacitor
                    </p>
                </div>

                <Alert className="mb-6 border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Important Note</AlertTitle>
                    <AlertDescription>
                        This setup must be performed in your local development environment, not within the Base44 platform interface. 
                        You'll need access to your project files and the ability to run command-line tools.
                    </AlertDescription>
                </Alert>

                <Tabs defaultValue="prerequisites" className="space-y-6">
                    <TabsList className="grid grid-cols-5 lg:grid-cols-8 gap-2">
                        <TabsTrigger value="prerequisites">Prerequisites</TabsTrigger>
                        <TabsTrigger value="install">Installation</TabsTrigger>
                        <TabsTrigger value="configure">Configuration</TabsTrigger>
                        <TabsTrigger value="build">Build APK</TabsTrigger>
                        <TabsTrigger value="kiosk">Kiosk Mode</TabsTrigger>
                        <TabsTrigger value="deploy">Deployment</TabsTrigger>
                        <TabsTrigger value="troubleshoot">Troubleshooting</TabsTrigger>
                        <TabsTrigger value="mdm">MDM Options</TabsTrigger>
                    </TabsList>

                    {/* Prerequisites Tab */}
                    <TabsContent value="prerequisites">
                        <Card>
                            <CardHeader>
                                <CardTitle>Prerequisites</CardTitle>
                                <CardDescription>Software and tools required before starting</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Badge className="mt-1">1</Badge>
                                        <div className="flex-1">
                                            <h3 className="font-semibold mb-2">Node.js and npm</h3>
                                            <p className="text-sm text-gray-600 mb-2">Version 16 or higher required</p>
                                            <CodeBlock
                                                id="node-check"
                                                code={`# Check if installed:\nnode --version\nnpm --version`}
                                            />
                                            <p className="text-sm text-gray-600 mt-2">
                                                Download from: <a href="https://nodejs.org/" target="_blank" className="text-blue-600 underline">nodejs.org</a>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Badge className="mt-1">2</Badge>
                                        <div className="flex-1">
                                            <h3 className="font-semibold mb-2">Java Development Kit (JDK)</h3>
                                            <p className="text-sm text-gray-600 mb-2">JDK 11 or higher required</p>
                                            <CodeBlock
                                                id="java-check"
                                                code={`# Check if installed:\njava -version\n\n# Set JAVA_HOME (example):\nexport JAVA_HOME=/path/to/jdk`}
                                            />
                                            <p className="text-sm text-gray-600 mt-2">
                                                Download from: <a href="https://adoptium.net/" target="_blank" className="text-blue-600 underline">adoptium.net</a>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Badge className="mt-1">3</Badge>
                                        <div className="flex-1">
                                            <h3 className="font-semibold mb-2">Android Studio</h3>
                                            <p className="text-sm text-gray-600 mb-2">
                                                Required for building and testing Android apps
                                            </p>
                                            <Alert className="mb-2">
                                                <AlertTriangle className="h-4 w-4" />
                                                <AlertDescription className="text-sm">
                                                    During installation, ensure "Android SDK" and "Android Virtual Device" are selected
                                                </AlertDescription>
                                            </Alert>
                                            <p className="text-sm text-gray-600">
                                                Download from: <a href="https://developer.android.com/studio" target="_blank" className="text-blue-600 underline">developer.android.com/studio</a>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Installation Tab */}
                    <TabsContent value="install">
                        <Card>
                            <CardHeader>
                                <CardTitle>Capacitor Installation</CardTitle>
                                <CardDescription>Install Capacitor and add Android platform</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold mb-3">Step 1: Navigate to Your Project</h3>
                                        <CodeBlock
                                            id="nav-project"
                                            code={`cd /path/to/your/fuelflowpro-project`}
                                        />
                                    </div>

                                    <div>
                                        <h3 className="font-semibold mb-3">Step 2: Install Capacitor Dependencies</h3>
                                        <CodeBlock
                                            id="install-cap"
                                            code={`# Install Capacitor core and CLI\nnpm install @capacitor/core @capacitor/cli\n\n# Install Android platform\nnpm install @capacitor/android`}
                                        />
                                    </div>

                                    <div>
                                        <h3 className="font-semibold mb-3">Step 3: Initialize Capacitor</h3>
                                        <CodeBlock
                                            id="init-cap"
                                            code={`npx cap init "FuelFlow Pro" "com.fuelflowpro.pos" --web-dir=dist`}
                                        />
                                        <Alert className="mt-3">
                                            <Info className="h-4 w-4" />
                                            <AlertDescription className="text-sm">
                                                Replace "dist" with your actual build output directory. Common options: dist, build, public, out
                                            </AlertDescription>
                                        </Alert>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold mb-3">Step 4: Add Android Platform</h3>
                                        <CodeBlock
                                            id="add-android"
                                            code={`npx cap add android`}
                                        />
                                        <p className="text-sm text-gray-600 mt-2">
                                            This creates an "android" folder with a complete Android Studio project
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Configuration Tab */}
                    <TabsContent value="configure">
                        <Card>
                            <CardHeader>
                                <CardTitle>Configuration Files</CardTitle>
                                <CardDescription>Create and configure necessary files</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <h3 className="font-semibold mb-3">capacitor.config.json</h3>
                                    <p className="text-sm text-gray-600 mb-3">
                                        Create this file in your project root directory:
                                    </p>
                                    <CodeBlock
                                        id="cap-config"
                                        code={`{
  "appId": "com.fuelflowpro.pos",
  "appName": "FuelFlow Pro",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "allowNavigation": [
      "*.base44.com",
      "localhost"
    ]
  },
  "android": {
    "backgroundColor": "#ffffff"
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#1e40af",
      "showSpinner": true,
      "spinnerColor": "#ffffff"
    }
  }
}`}
                                    />
                                </div>

                                <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Important: Base44 Integration</AlertTitle>
                                    <AlertDescription>
                                        <p className="mb-2">Since FuelFlow Pro is built on Base44, you may need to:</p>
                                        <ul className="list-disc list-inside space-y-1 text-sm">
                                            <li>Contact Base44 support for build/export instructions</li>
                                            <li>Verify the correct build output directory</li>
                                            <li>Ensure API endpoints are correctly configured</li>
                                            <li>Add any Base44-specific domains to allowNavigation</li>
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Build APK Tab */}
                    <TabsContent value="build">
                        <Card>
                            <CardHeader>
                                <CardTitle>Building Your APK</CardTitle>
                                <CardDescription>Create a production-ready Android application</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold mb-3">Step 1: Build Your Web App</h3>
                                        <CodeBlock
                                            id="build-web"
                                            code={`# Standard build command (adjust based on your setup)\nnpm run build\n# OR\nyarn build`}
                                        />
                                    </div>

                                    <div>
                                        <h3 className="font-semibold mb-3">Step 2: Sync to Android</h3>
                                        <CodeBlock
                                            id="sync-android"
                                            code={`npx cap sync android`}
                                        />
                                        <p className="text-sm text-gray-600 mt-2">
                                            This copies your web app build into the Android project
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold mb-3">Step 3: Open in Android Studio</h3>
                                        <CodeBlock
                                            id="open-studio"
                                            code={`npx cap open android`}
                                        />
                                    </div>

                                    <div>
                                        <h3 className="font-semibold mb-3">Step 4: Generate Signing Key (First Time Only)</h3>
                                        <CodeBlock
                                            id="gen-key"
                                            code={`cd android\nkeytool -genkey -v -keystore release-key.keystore -alias fuelflowpro -keyalg RSA -keysize 2048 -validity 10000`}
                                        />
                                        <Alert className="mt-3 border-red-200 bg-red-50">
                                            <AlertTriangle className="h-4 w-4 text-red-600" />
                                            <AlertTitle className="text-red-800">Critical: Save Your Keystore</AlertTitle>
                                            <AlertDescription className="text-red-700">
                                                Store the keystore file and password in multiple secure locations. 
                                                If you lose them, you cannot update your app on deployed devices.
                                            </AlertDescription>
                                        </Alert>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold mb-3">Step 5: Build Release APK</h3>
                                        <p className="text-sm text-gray-600 mb-2">In Android Studio:</p>
                                        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                                            <li>Go to Build → Generate Signed Bundle / APK</li>
                                            <li>Select "APK" and click Next</li>
                                            <li>Choose your keystore file and enter credentials</li>
                                            <li>Select "release" build variant</li>
                                            <li>Check V1 and V2 signature versions</li>
                                            <li>Click Finish</li>
                                        </ol>
                                        <p className="text-sm text-gray-600 mt-3">
                                            Your APK will be in: <code className="bg-gray-100 px-2 py-1 rounded">android/app/release/app-release.apk</code>
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Kiosk Mode Tab */}
                    <TabsContent value="kiosk">
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Kiosk Mode Options</CardTitle>
                                    <CardDescription>Prevent users from accessing other apps or browsing the web</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <Card className="border-2">
                                            <CardHeader>
                                                <CardTitle className="text-lg">Screen Pinning</CardTitle>
                                                <Badge variant="outline">Easiest</Badge>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                <p className="text-sm text-gray-600">Best for: 1-2 locations, testing</p>
                                                <div className="space-y-1 text-sm">
                                                    <p className="font-semibold">Setup:</p>
                                                    <ol className="list-decimal list-inside space-y-1 text-gray-700">
                                                        <li>Settings → Security → Screen Pinning → ON</li>
                                                        <li>Open FuelFlow Pro</li>
                                                        <li>Tap Recent Apps → Pin icon</li>
                                                    </ol>
                                                </div>
                                                <Alert className="mt-3">
                                                    <Info className="h-4 w-4" />
                                                    <AlertDescription className="text-xs">
                                                        Users can unpin if they know the gesture. Not suitable for unsupervised locations.
                                                    </AlertDescription>
                                                </Alert>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-2 border-green-200 bg-green-50">
                                            <CardHeader>
                                                <CardTitle className="text-lg">MDM Solution</CardTitle>
                                                <Badge className="bg-green-600">Recommended</Badge>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                <p className="text-sm text-gray-600">Best for: 5+ locations, enterprise</p>
                                                <div className="space-y-2 text-sm">
                                                    <p className="font-semibold">Popular Options:</p>
                                                    <ul className="space-y-1 text-gray-700">
                                                        <li>• <strong>Google Workspace:</strong> Free tier (10 devices)</li>
                                                        <li>• <strong>Miradore:</strong> Free tier (25 devices)</li>
                                                        <li>• <strong>Scalefusion:</strong> $2-4/device/month</li>
                                                    </ul>
                                                </div>
                                                <Alert className="mt-3 border-green-300">
                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                    <AlertDescription className="text-xs">
                                                        Central management, remote updates, impossible to bypass
                                                    </AlertDescription>
                                                </Alert>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Detailed MDM Setup Example (Scalefusion)</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <ol className="space-y-3 text-sm">
                                        <li className="flex gap-3">
                                            <Badge className="h-6 min-w-6">1</Badge>
                                            <div>
                                                <p className="font-semibold">Create Account</p>
                                                <p className="text-gray-600">Sign up at scalefusion.com and create organization profile</p>
                                            </div>
                                        </li>
                                        <li className="flex gap-3">
                                            <Badge className="h-6 min-w-6">2</Badge>
                                            <div>
                                                <p className="font-semibold">Generate Enrollment QR Code</p>
                                                <p className="text-gray-600">Scalefusion Console → Devices → Enroll Device</p>
                                            </div>
                                        </li>
                                        <li className="flex gap-3">
                                            <Badge className="h-6 min-w-6">3</Badge>
                                            <div>
                                                <p className="font-semibold">Factory Reset Device</p>
                                                <p className="text-gray-600">Settings → System → Reset → Factory Data Reset</p>
                                            </div>
                                        </li>
                                        <li className="flex gap-3">
                                            <Badge className="h-6 min-w-6">4</Badge>
                                            <div>
                                                <p className="font-semibold">Enroll During Setup</p>
                                                <p className="text-gray-600">Tap welcome screen 6 times → Scan QR code</p>
                                            </div>
                                        </li>
                                        <li className="flex gap-3">
                                            <Badge className="h-6 min-w-6">5</Badge>
                                            <div>
                                                <p className="font-semibold">Configure Policy</p>
                                                <p className="text-gray-600">Set Single App Mode → FuelFlow Pro only</p>
                                            </div>
                                        </li>
                                        <li className="flex gap-3">
                                            <Badge className="h-6 min-w-6">6</Badge>
                                            <div>
                                                <p className="font-semibold">Deploy APK</p>
                                                <p className="text-gray-600">Upload app-release.apk to MDM → Auto-installs on all devices</p>
                                            </div>
                                        </li>
                                    </ol>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Deployment Tab */}
                    <TabsContent value="deploy">
                        <Card>
                            <CardHeader>
                                <CardTitle>Deployment Methods</CardTitle>
                                <CardDescription>Choose how to distribute your APK to devices</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="border-l-4 border-blue-500 pl-4">
                                        <h3 className="font-semibold mb-2">Method 1: Direct Install (Sideloading)</h3>
                                        <p className="text-sm text-gray-600 mb-2">Best for: Testing, small deployments</p>
                                        <CodeBlock
                                            id="adb-install"
                                            code={`# Via USB with ADB\nadb install android/app/release/app-release.apk`}
                                        />
                                        <p className="text-sm text-gray-600 mt-2">
                                            Or copy APK to device and open it (requires "Unknown Sources" enabled)
                                        </p>
                                    </div>

                                    <div className="border-l-4 border-green-500 pl-4">
                                        <h3 className="font-semibold mb-2">Method 2: MDM Distribution</h3>
                                        <p className="text-sm text-gray-600 mb-2">Best for: Enterprise, multiple locations</p>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                            <li>Upload APK to MDM console once</li>
                                            <li>MDM automatically installs on all enrolled devices</li>
                                            <li>Push updates remotely</li>
                                            <li>Monitor installation status</li>
                                        </ul>
                                    </div>

                                    <div className="border-l-4 border-purple-500 pl-4">
                                        <h3 className="font-semibold mb-2">Method 3: Google Play Store</h3>
                                        <p className="text-sm text-gray-600 mb-2">Best for: Professional distribution, automatic updates</p>
                                        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                                            <li>Create Google Play Developer account ($25 one-time)</li>
                                            <li>Create new app in Play Console</li>
                                            <li>Upload AAB file (not APK)</li>
                                            <li>Can use Private/Internal testing or full public release</li>
                                        </ol>
                                    </div>
                                </div>

                                <Alert>
                                    <CheckCircle2 className="h-4 w-4" />
                                    <AlertTitle>Recommended Approach</AlertTitle>
                                    <AlertDescription>
                                        Use MDM distribution for the best balance of control, ease of updates, and security. 
                                        Scalefusion or similar MDM solutions allow you to push updates to all locations instantly.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Troubleshooting Tab */}
                    <TabsContent value="troubleshoot">
                        <Card>
                            <CardHeader>
                                <CardTitle>Common Issues & Solutions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="border rounded-lg p-4">
                                        <h3 className="font-semibold mb-2 text-red-600">Issue: Blank white screen on app launch</h3>
                                        <p className="text-sm text-gray-700 mb-2">Common causes:</p>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                            <li>Incorrect webDir in capacitor.config.json</li>
                                            <li>Forgot to run npx cap sync android after build</li>
                                            <li>Web app has hardcoded absolute URLs instead of relative paths</li>
                                        </ul>
                                        <p className="text-sm font-semibold mt-2">Solution:</p>
                                        <CodeBlock
                                            id="fix-blank"
                                            code={`# 1. Verify your build output directory\nls dist/  # or build/, public/, etc.\n\n# 2. Update capacitor.config.json webDir to match\n\n# 3. Rebuild and sync\nnpm run build\nnpx cap sync android\n\n# 4. Check Android Studio Logcat for JavaScript errors`}
                                        />
                                    </div>

                                    <div className="border rounded-lg p-4">
                                        <h3 className="font-semibold mb-2 text-red-600">Issue: "SDK location not found"</h3>
                                        <p className="text-sm font-semibold mt-2">Solution:</p>
                                        <p className="text-sm text-gray-600 mb-2">Create android/local.properties:</p>
                                        <CodeBlock
                                            id="fix-sdk"
                                            code={`# Mac\nsdk.dir=/Users/[username]/Library/Android/sdk\n\n# Windows\nsdk.dir=C:\\Users\\[username]\\AppData\\Local\\Android\\sdk\n\n# Linux\nsdk.dir=/home/[username]/Android/sdk`}
                                        />
                                    </div>

                                    <div className="border rounded-lg p-4">
                                        <h3 className="font-semibold mb-2 text-red-600">Issue: App crashes immediately</h3>
                                        <p className="text-sm text-gray-700 mb-2">Check Android Studio Logcat for errors</p>
                                        <p className="text-sm text-gray-600">Common fixes:</p>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                            <li>Update Gradle version</li>
                                            <li>Clear Android Studio caches (File → Invalidate Caches)</li>
                                            <li>Check for JavaScript errors in web app</li>
                                        </ul>
                                    </div>

                                    <div className="border rounded-lg p-4">
                                        <h3 className="font-semibold mb-2 text-red-600">Issue: Cannot connect to Base44 API</h3>
                                        <p className="text-sm font-semibold mt-2">Solution:</p>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                            <li>Verify allowNavigation includes all Base44 domains</li>
                                            <li>Check network permissions in AndroidManifest.xml</li>
                                            <li>Ensure HTTPS certificates are valid</li>
                                            <li>Test API endpoints from device browser first</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* MDM Options Tab */}
                    <TabsContent value="mdm">
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Mobile Device Management (MDM) Comparison</CardTitle>
                                    <CardDescription>Choose the right MDM solution for your deployment</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left p-2">Solution</th>
                                                    <th className="text-left p-2">Free Tier</th>
                                                    <th className="text-left p-2">Paid Pricing</th>
                                                    <th className="text-left p-2">Best For</th>
                                                    <th className="text-left p-2">Key Features</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="border-b">
                                                    <td className="p-2 font-semibold">Google Workspace</td>
                                                    <td className="p-2">10 devices</td>
                                                    <td className="p-2">$6-18/user/month</td>
                                                    <td className="p-2">Small businesses</td>
                                                    <td className="p-2">Basic kiosk mode, Google integration</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="p-2 font-semibold">Miradore</td>
                                                    <td className="p-2">25 devices</td>
                                                    <td className="p-2">$2/device/month</td>
                                                    <td className="p-2">Growing businesses</td>
                                                    <td className="p-2">App distribution, remote control</td>
                                                </tr>
                                                <tr className="border-b bg-green-50">
                                                    <td className="p-2 font-semibold">Scalefusion</td>
                                                    <td className="p-2">14-day trial</td>
                                                    <td className="p-2">$2-4/device/month</td>
                                                    <td className="p-2">Retail/Enterprise</td>
                                                    <td className="p-2">Advanced kiosk, multi-app mode, excellent support</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="p-2 font-semibold">ManageEngine</td>
                                                    <td className="p-2">25 devices</td>
                                                    <td className="p-2">$1-3/device/month</td>
                                                    <td className="p-2">IT-focused teams</td>
                                                    <td className="p-2">Comprehensive features, steep learning curve</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="p-2 font-semibold">Hexnode</td>
                                                    <td className="p-2">14-day trial</td>
                                                    <td className="p-2">$1-3/device/month</td>
                                                    <td className="p-2">Multi-platform</td>
                                                    <td className="p-2">iOS, Android, Windows support</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="p-2 font-semibold">Samsung Knox</td>
                                                    <td className="p-2">Varies</td>
                                                    <td className="p-2">Device-dependent</td>
                                                    <td className="p-2">Samsung devices only</td>
                                                    <td className="p-2">Deep OS integration, very secure</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-2 border-blue-200 bg-blue-50">
                                <CardHeader>
                                    <CardTitle>Recommendation for FuelFlow Pro</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm">Based on convenience store POS requirements:</p>
                                    <div className="bg-white rounded-lg p-4">
                                        <h3 className="font-semibold text-lg mb-2">Scalefusion (Recommended)</h3>
                                        <ul className="space-y-2 text-sm">
                                            <li className="flex items-start gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                                <span>Purpose-built for retail kiosk applications</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                                <span>Single-app kiosk mode prevents any other app access</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                                <span>Easy APK distribution and updates across all locations</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                                <span>Remote troubleshooting and device monitoring</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                                <span>Geofencing alerts if device leaves location</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                                <span>Excellent support for troubleshooting</span>
                                            </li>
                                        </ul>
                                        <p className="text-sm text-gray-600 mt-3">
                                            Start with 14-day free trial to test with 2-3 devices before committing
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}