import { DAY_NAMES_EN } from 'lib/days';

interface PrayerTimeRow {
  prayer: string;
  times: string[];
}

export default function PrayerTimesTable() {
  // Days starting from Friday
  const days = [
    DAY_NAMES_EN[5], // Friday
    DAY_NAMES_EN[6], // Saturday
    DAY_NAMES_EN[0], // Sunday
    DAY_NAMES_EN[1], // Monday
    DAY_NAMES_EN[2], // Tuesday
    DAY_NAMES_EN[3], // Wednesday
    DAY_NAMES_EN[4], // Thursday
  ];

  // Prayer times starting from Maghrib
  const prayerTimes: PrayerTimeRow[] = [
    {
      prayer: 'Maghrib',
      times: ['18:45', '18:46', '18:47', '18:48', '18:49', '18:50', '18:51']
    },
    {
      prayer: 'Isha',
      times: ['20:00', '20:01', '20:02', '20:03', '20:04', '20:05', '20:06']
    },
    {
      prayer: 'Fajr',
      times: ['04:30', '04:31', '04:32', '04:33', '04:34', '04:35', '04:36']
    },
    {
      prayer: 'Dhuhr',
      times: ['12:15', '12:16', '12:17', '12:18', '12:19', '12:20', '12:21']
    },
    {
      prayer: 'Asr',
      times: ['15:45', '15:46', '15:47', '15:48', '15:49', '15:50', '15:51']
    }
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Prayer Times</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          {/* Header row */}
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
                Prayer
              </th>
              {days.map((day, index) => (
                <th 
                  key={index} 
                  className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-700"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Body rows */}
          <tbody>
            {prayerTimes.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 px-4 py-2 font-medium text-gray-800">
                  {row.prayer}
                </td>
                {row.times.map((time, timeIndex) => (
                  <td 
                    key={timeIndex} 
                    className="border border-gray-300 px-4 py-2 text-center text-gray-700"
                  >
                    {time}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
