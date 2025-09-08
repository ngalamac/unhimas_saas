import React, { useState } from 'react';
import { Shield, Smartphone, Mail, Key, QrCode, CheckCircle, XCircle } from 'lucide-react';

export const TwoFactorAuthPage: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'SMS' | 'Email' | 'Authenticator'>('SMS');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes] = useState([
    'ABC123DEF456',
    'GHI789JKL012',
    'MNO345PQR678',
    'STU901VWX234',
    'YZA567BCD890'
  ]);

  const handleEnable2FA = () => {
    setIsEnabled(true);
  };

  const handleDisable2FA = () => {
    setIsEnabled(false);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h1>
        <p className="text-gray-600">Enhance your account security with two-factor authentication</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2FA Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isEnabled ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <Shield className={`w-5 h-5 ${isEnabled ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Security Status</h2>
              <p className={`text-sm ${isEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {isEnabled ? 'Two-Factor Authentication is enabled' : 'Two-Factor Authentication is disabled'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {isEnabled ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="text-sm font-medium text-gray-900">Account Protection</span>
              </div>
              <span className={`text-sm ${isEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {isEnabled ? 'Protected' : 'Vulnerable'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {isEnabled ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="text-sm font-medium text-gray-900">Login Security</span>
              </div>
              <span className={`text-sm ${isEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {isEnabled ? 'Enhanced' : 'Basic'}
              </span>
            </div>

            {isEnabled ? (
              <button
                onClick={handleDisable2FA}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Disable 2FA
              </button>
            ) : (
              <button
                onClick={handleEnable2FA}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Enable 2FA
              </button>
            )}
          </div>
        </div>

        {/* 2FA Setup */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Authentication Methods</h2>

          <div className="space-y-4">
            {/* SMS Method */}
            <div
              onClick={() => setSelectedMethod('SMS')}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedMethod === 'SMS' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Smartphone className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">SMS Authentication</h3>
                  <p className="text-sm text-gray-600">Receive codes via text message</p>
                </div>
              </div>
              {selectedMethod === 'SMS' && (
                <div className="mt-3">
                  <input
                    type="tel"
                    placeholder="+237 6XX XXX XXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Email Method */}
            <div
              onClick={() => setSelectedMethod('Email')}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedMethod === 'Email' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Mail className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Email Authentication</h3>
                  <p className="text-sm text-gray-600">Receive codes via email</p>
                </div>
              </div>
              {selectedMethod === 'Email' && (
                <div className="mt-3">
                  <input
                    type="email"
                    placeholder="your.email@unhimas.edu.cm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Authenticator App Method */}
            <div
              onClick={() => setSelectedMethod('Authenticator')}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedMethod === 'Authenticator' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <QrCode className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Authenticator App</h3>
                  <p className="text-sm text-gray-600">Use Google Authenticator or similar app</p>
                </div>
              </div>
              {selectedMethod === 'Authenticator' && (
                <div className="mt-3 text-center">
                  <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">Scan this QR code with your authenticator app</p>
                </div>
              )}
            </div>
          </div>

          {/* Verification */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="w-full mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Verify & Enable
            </button>
          </div>
        </div>

        {/* Backup Codes */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-yellow-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Backup Codes</h2>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Save these backup codes in a safe place. You can use them to access your account if you lose your device.
          </p>

          <div className="grid grid-cols-1 gap-2">
            {backupCodes.map((code, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded font-mono text-sm text-center">
                {code}
              </div>
            ))}
          </div>

          <div className="mt-4 flex space-x-2">
            <button className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
              Download Codes
            </button>
            <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Generate New
            </button>
          </div>
        </div>

        {/* Security Tips */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Tips</h2>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Use a strong password</p>
                <p className="text-xs text-gray-600">Combine letters, numbers, and symbols</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Keep backup codes safe</p>
                <p className="text-xs text-gray-600">Store them in a secure location</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Don't share your codes</p>
                <p className="text-xs text-gray-600">Never give codes to anyone</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Update your contact info</p>
                <p className="text-xs text-gray-600">Keep phone and email current</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};