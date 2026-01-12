'use client';

interface BasicInfoFormProps {
  name: string;
  email: string;
  phone: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
}

const BasicInfoForm = ({
  name,
  email,
  phone,
  onNameChange,
  onEmailChange,
  onPhoneChange,
}: BasicInfoFormProps) => {
  return (
    <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
      <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
        <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
          1
        </span>
        Thông tin cơ bản
      </h3>
      <div className="space-y-2">
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Họ và tên *"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none bg-white"
          required
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="Email *"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none bg-white"
            required
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="Số điện thoại"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none bg-white"
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInfoForm;










