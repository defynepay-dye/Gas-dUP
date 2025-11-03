import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle2, Scan, Camera, QrCode, Keyboard } from "lucide-react";
import { AgeVerification } from "@/api/entities";

export default function EnhancedAgeVerification({ onVerified, onClose, settings = { age_verification_method: 'manual' } }) {
  const [verificationMethod, setVerificationMethod] = useState(settings.age_verification_method || 'manual');
  const [verificationData, setVerificationData] = useState({
    birthdate: "",
    idType: "",
    idNumber: "",
    scannedData: null
  });
  const [calculatedAge, setCalculatedAge] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const videoRef = useRef(null);

  const handleBirthdateChange = (birthdate) => {
    setVerificationData({...verificationData, birthdate});
    
    if (birthdate) {
      const today = new Date();
      const birth = new Date(birthdate);
      const age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        setCalculatedAge(age - 1);
      } else {
        setCalculatedAge(age);
      }
    } else {
      setCalculatedAge(null);
    }
  };

  const handleQRScan = (scannedText) => {
    // Parse common ID QR code formats
    try {
      // AAMVA format parsing (most US driver licenses)
      if (scannedText.includes('DCS') || scannedText.includes('DAA')) {
        const lines = scannedText.split('\n');
        let birthdate = '';
        let lastName = '';
        let firstName = '';
        
        lines.forEach(line => {
          if (line.startsWith('DBB')) {
            // Birth date in MMDDYYYY format
            const date = line.substring(3);
            if (date.length === 8) {
              birthdate = `${date.substring(4, 8)}-${date.substring(0, 2)}-${date.substring(2, 4)}`;
            }
          } else if (line.startsWith('DCS')) {
            lastName = line.substring(3);
          } else if (line.startsWith('DAC')) {
            firstName = line.substring(3);
          }
        });
        
        if (birthdate) {
          setVerificationData({
            ...verificationData,
            birthdate,
            idType: 'drivers_license',
            scannedData: { firstName, lastName, source: 'qr_scan' }
          });
          handleBirthdateChange(birthdate);
        }
      }
    } catch (error) {
      console.error('Error parsing QR code:', error);
      alert('Could not parse ID information from QR code');
    }
  };

  const handle2DScan = (scannedData) => {
    // Parse 2D barcode (PDF417) data
    try {
      // This would integrate with a proper 2D barcode scanner
      // For now, simulate parsing
      if (scannedData && scannedData.birthDate) {
        setVerificationData({
          ...verificationData,
          birthdate: scannedData.birthDate,
          idType: scannedData.documentType || 'drivers_license',
          scannedData: { ...scannedData, source: '2d_scan' }
        });
        handleBirthdateChange(scannedData.birthDate);
      }
    } catch (error) {
      console.error('Error parsing 2D barcode:', error);
      alert('Could not parse ID information from 2D barcode');
    }
  };

  const startCameraScan = async () => {
    try {
      setScannerActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera for scanning');
      setScannerActive(false);
    }
  };

  const stopCameraScan = () => {
    setScannerActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleVerify = async () => {
    if (!verificationData.birthdate || !verificationData.idType) {
      alert("Please fill in all required fields");
      return;
    }

    if (calculatedAge < 21) {
      alert("Customer is under 21 and cannot purchase age-restricted items");
      return;
    }

    setIsProcessing(true);

    try {
      await AgeVerification.create({
        customer_birthdate: verificationData.birthdate,
        id_type: verificationData.idType,
        id_number: verificationData.idNumber,
        verification_method: verificationMethod,
        verified_age: calculatedAge,
        scanned_data: verificationData.scannedData
      });

      onVerified();
    } catch (error) {
      console.error("Age verification failed:", error);
      alert("Verification failed. Please try again.");
    }

    setIsProcessing(false);
  };

  const isValid = calculatedAge !== null && calculatedAge >= 21;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Enhanced Age Verification Required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-800">
              This transaction contains age-restricted items. Customer must be 21+ years old.
            </div>
          </div>

          <Tabs value={verificationMethod} onValueChange={setVerificationMethod}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="manual" className="text-xs">
                <Keyboard className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="scanner_2d" className="text-xs">
                <Scan className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="scanner_qr" className="text-xs">
                <QrCode className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="camera_scan" className="text-xs">
                <Camera className="w-3 h-3" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4">
              <div>
                <Label htmlFor="birthdate">Customer Birth Date</Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={verificationData.birthdate}
                  onChange={(e) => handleBirthdateChange(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <Label htmlFor="idType">ID Type</Label>
                <Select 
                  value={verificationData.idType} 
                  onValueChange={(value) => setVerificationData({...verificationData, idType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drivers_license">Driver's License</SelectItem>
                    <SelectItem value="state_id">State ID</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="military_id">Military ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="scanner_2d" className="space-y-4">
              <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                <Scan className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">Scan the 2D barcode on the back of the ID</p>
                <Button onClick={() => handle2DScan({ birthDate: '1990-01-01', documentType: 'drivers_license' })}>
                  Simulate 2D Scan
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="scanner_qr" className="space-y-4">
              <div className="space-y-4">
                <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                  <QrCode className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">Scan QR code or enter scanned text</p>
                </div>
                <Input
                  placeholder="Paste scanned QR code data here"
                  onChange={(e) => handleQRScan(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="camera_scan" className="space-y-4">
              <div className="text-center">
                {scannerActive ? (
                  <div className="space-y-4">
                    <video ref={videoRef} autoPlay className="w-full max-w-sm mx-auto rounded-lg" />
                    <div className="flex gap-2 justify-center">
                      <Button onClick={stopCameraScan} variant="outline">
                        Stop Camera
                      </Button>
                      <Button onClick={() => {
                        // Simulate capture
                        handleQRScan('Sample QR data');
                        stopCameraScan();
                      }}>
                        Capture
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg">
                    <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">Use camera to scan ID</p>
                    <Button onClick={startCameraScan}>
                      Start Camera
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {calculatedAge !== null && (
            <div className={`text-center p-3 rounded-lg ${calculatedAge >= 21 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className={`text-lg font-bold ${calculatedAge >= 21 ? 'text-green-600' : 'text-red-600'}`}>
                Age: {calculatedAge} years old
                {calculatedAge >= 21 ? (
                  <CheckCircle2 className="w-5 h-5 inline ml-2" />
                ) : (
                  <AlertTriangle className="w-5 h-5 inline ml-2" />
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel Transaction
            </Button>
            <Button
              onClick={handleVerify}
              disabled={!isValid || isProcessing}
              className={isValid ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {isProcessing ? "Verifying..." : "Verify Age"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}