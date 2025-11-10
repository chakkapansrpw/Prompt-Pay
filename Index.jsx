import React, { useState, useEffect } from 'react';
import { Smartphone, CreditCard, QrCode, Settings } from 'lucide-react';

// ฟังก์ชันสร้าง CRC16 สำหรับ PromptPay
function crc16(data) {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

// ฟังก์ชันสร้าง PromptPay Payload
function generatePromptPayQR(id, amount = null) {
  const formatID = (id) => {
    id = id.replace(/[^0-9]/g, '');
    if (id.length === 13) return `0066${id}`;
    if (id.length === 10) return `0066${id}`;
    return id;
  };

  const formatAmount = (amt) => {
    return parseFloat(amt).toFixed(2);
  };

  let payload = '';
  payload += '000201'; // Payload Format Indicator
  payload += '010212'; // Point of Initiation Method (12 = QR is static with amount)
  
  // Merchant Account Information
  const formattedID = formatID(id);
  const aidTag = `0016A000000677010111${formattedID.length.toString().padStart(2, '0')}${formattedID}`;
  payload += `29${aidTag.length.toString().padStart(2, '0')}${aidTag}`;
  
  payload += '5802TH'; // Country Code
  
  if (amount && parseFloat(amount) > 0) {
    const amtStr = formatAmount(amount);
    payload += `54${amtStr.length.toString().padStart(2, '0')}${amtStr}`;
  }
  
  payload += '6304'; // CRC placeholder
  const checksum = crc16(payload);
  payload += checksum;
  
  return payload;
}

export default function PromptPayQRGenerator() {
  const [idType, setIdType] = useState('citizen'); // 'citizen' or 'phone'
  const [idNumber, setIdNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [qrData, setQrData] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const quickAmounts = [20, 50, 100, 200, 500, 1000, 2000, 5000];

  useEffect(() => {
    if (idNumber) {
      generateQR(amount);
    }
  }, [idNumber, amount]);

  const generateQR = (amt) => {
    if (!idNumber) return;
    const payload = generatePromptPayQR(idNumber, amt);
    
    // สร้าง QR Code URL (ใช้ API ฟรี)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}`;
    setQrData(qrUrl);
  };

  const handleQuickAmount = (amt) => {
    setAmount(amt.toString());
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
  };

  const formatIDDisplay = (value) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (idType === 'citizen' && cleaned.length <= 13) {
      return cleaned.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5');
    } else if (idType === 'phone' && cleaned.length <= 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    return cleaned;
  };

  const handleIDChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const maxLength = idType === 'citizen' ? 13 : 10;
    if (value.length <= maxLength) {
      setIdNumber(value);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <QrCode className="w-12 h-12 text-white" />
            <h1 className="text-4xl font-bold text-white">PromptPay QR</h1>
          </div>
          <p className="text-white text-lg">สร้าง QR Code พร้อมเพย์ง่ายๆ ในคลิกเดียว</p>
        </div>

        {/* Settings Toggle */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full font-semibold hover:bg-white/30 transition-all flex items-center gap-2"
          >
            <Settings className="w-5 h-5" />
            ตั้งค่าบัญชี
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6 animate-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">ข้อมูลบัญชีพร้อมเพย์</h2>
            
            {/* ID Type Selection */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => {
                  setIdType('citizen');
                  setIdNumber('');
                }}
                className={`p-6 rounded-2xl font-semibold text-lg transition-all ${
                  idType === 'citizen'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <CreditCard className="w-8 h-8 mx-auto mb-2" />
                เลขบัตรประชาชน
              </button>
              <button
                onClick={() => {
                  setIdType('phone');
                  setIdNumber('');
                }}
                className={`p-6 rounded-2xl font-semibold text-lg transition-all ${
                  idType === 'phone'
                    ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Smartphone className="w-8 h-8 mx-auto mb-2" />
                เบอร์โทรศัพท์
              </button>
            </div>

            {/* ID Input */}
            <div>
              <label className="block text-gray-700 font-semibold mb-3 text-lg">
                {idType === 'citizen' ? 'เลขบัตรประชาชน 13 หัก' : 'เบอร์โทรศัพท์ 10 หลัก'}
              </label>
              <input
                type="text"
                value={formatIDDisplay(idNumber)}
                onChange={handleIDChange}
                placeholder={idType === 'citizen' ? '0-0000-00000-00-0' : '000-000-0000'}
                className="w-full px-6 py-4 text-2xl text-center border-4 border-gray-300 rounded-2xl focus:border-purple-500 focus:outline-none font-mono"
              />
              <p className="text-sm text-gray-500 mt-2 text-center">
                {idType === 'citizen' 
                  ? `ใส่ไปแล้ว ${idNumber.length}/13 หลัก`
                  : `ใส่ไปแล้ว ${idNumber.length}/10 หลัก`}
              </p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {idNumber && (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            {/* Amount Input */}
            <div className="mb-8">
              <label className="block text-gray-700 font-bold mb-4 text-2xl text-center">
                ระบุจำนวนเงิน (บาท)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  className="w-full px-6 py-6 text-5xl text-center border-4 border-gray-300 rounded-3xl focus:border-pink-500 focus:outline-none font-bold text-pink-600"
                />
                <span className="absolute right-8 top-1/2 transform -translate-y-1/2 text-3xl text-gray-400 font-bold">
                  ฿
                </span>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-3 mb-8">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleQuickAmount(amt)}
                  className="bg-gradient-to-r from-purple-400 to-pink-400 text-white py-4 px-4 rounded-2xl font-bold text-xl hover:from-purple-500 hover:to-pink-500 transition-all hover:scale-105 shadow-lg"
                >
                  {amt}฿
                </button>
              ))}
            </div>

            {/* QR Code Display */}
            {qrData && (
              <div className="text-center">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-3xl inline-block shadow-inner">
                  <img
                    src={qrData}
                    alt="PromptPay QR Code"
                    className="w-80 h-80 mx-auto bg-white p-4 rounded-2xl shadow-lg"
                  />
                </div>
                <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl">
                  <p className="text-gray-600 font-semibold text-lg">ยอดโอน</p>
                  <p className="text-5xl font-bold text-green-600 mt-2">
                    {amount ? `${parseFloat(amount).toFixed(2)} ฿` : 'ไม่ระบุยอด'}
                  </p>
                  {!amount && (
                    <p className="text-sm text-gray-500 mt-2">ผู้โอนสามารถระบุยอดเองได้</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Initial State */}
        {!idNumber && (
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 text-center">
            <QrCode className="w-24 h-24 text-white/50 mx-auto mb-4" />
            <p className="text-white text-xl font-semibold">
              กรุณากดปุ่ม "ตั้งค่าบัญชี" เพื่อเริ่มต้นใช้งาน
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
