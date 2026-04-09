import { useState, useEffect } from 'react'
import { Sidebar } from '../components/layouts/Sidebar'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getAIResponse } from '../lib/groq'
import { 
  Calendar, 
  Clock, 
  Video, 
  Search,
  Star,
  ChevronRight,
  Loader,
  Sparkles,
  X,
  CheckCircle
} from 'lucide-react'

interface TimeSlot {
  date: string
  time: string
  available: boolean
}

interface Doctor {
  id: string
  full_name: string
  specialization: string
  experience_years: number
  consultation_fee: number
  about: string
  languages: string[]
  is_available: boolean
  average_rating: number
  avatar_url?: string | null
  available_slots?: TimeSlot[]
}

interface Appointment {
  id: number
  doctor_id: string
  doctor?: Doctor
  appointment_date: string
  appointment_time: string
  status: string
  priority: string
  patient_issue: string
}

// Generate time slots for the next 7 days
const generateTimeSlots = () => {
  const slots = []
  const today = new Date()
  
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    
    // Morning slots
    slots.push({ date: dateStr, time: '09:00 AM', available: Math.random() > 0.3 })
    slots.push({ date: dateStr, time: '10:00 AM', available: Math.random() > 0.3 })
    slots.push({ date: dateStr, time: '11:00 AM', available: Math.random() > 0.3 })
    
    // Afternoon slots
    slots.push({ date: dateStr, time: '02:00 PM', available: Math.random() > 0.3 })
    slots.push({ date: dateStr, time: '03:00 PM', available: Math.random() > 0.3 })
    slots.push({ date: dateStr, time: '04:00 PM', available: Math.random() > 0.3 })
  }
  
  return slots
}

// Generate mock doctors
const generateMockDoctors = (): Doctor[] => {
  return [
    {
      id: 'mock-1',
      full_name: 'Sarah Johnson',
      specialization: 'Cardiology',
      experience_years: 15,
      consultation_fee: 150,
      about: 'Board-certified cardiologist with expertise in preventive cardiology and heart disease management.',
      languages: ['English', 'Spanish'],
      is_available: true,
      average_rating: 4.8,
      avatar_url: null,
      available_slots: generateTimeSlots()
    },
    {
      id: 'mock-2',
      full_name: 'Michael Chen',
      specialization: 'Pediatrics',
      experience_years: 12,
      consultation_fee: 120,
      about: 'Pediatrician specializing in childhood development and preventive care.',
      languages: ['English', 'Mandarin'],
      is_available: true,
      average_rating: 4.9,
      avatar_url: null,
      available_slots: generateTimeSlots()
    },
    {
      id: 'mock-3',
      full_name: 'Emily Rodriguez',
      specialization: 'Dermatology',
      experience_years: 10,
      consultation_fee: 130,
      about: 'Dermatologist focusing on medical and cosmetic dermatology.',
      languages: ['English', 'Portuguese'],
      is_available: true,
      average_rating: 4.7,
      avatar_url: null,
      available_slots: generateTimeSlots()
    },
    {
      id: 'mock-4',
      full_name: 'David Kim',
      specialization: 'Neurology',
      experience_years: 18,
      consultation_fee: 200,
      about: 'Neurologist specializing in headaches, epilepsy, and movement disorders.',
      languages: ['English', 'Korean'],
      is_available: true,
      average_rating: 4.9,
      avatar_url: null,
      available_slots: generateTimeSlots()
    },
    {
      id: 'mock-5',
      full_name: 'Priya Sharma',
      specialization: 'Internal Medicine',
      experience_years: 8,
      consultation_fee: 100,
      about: 'Internal medicine physician focused on adult healthcare and chronic disease management.',
      languages: ['English', 'Hindi'],
      is_available: true,
      average_rating: 4.6,
      avatar_url: null,
      available_slots: generateTimeSlots()
    },
    {
      id: 'mock-6',
      full_name: 'James Wilson',
      specialization: 'Orthopedics',
      experience_years: 20,
      consultation_fee: 180,
      about: 'Orthopedic surgeon specializing in sports medicine and joint replacement.',
      languages: ['English'],
      is_available: true,
      average_rating: 4.8,
      avatar_url: null,
      available_slots: generateTimeSlots()
    }
  ]
}

export function Appointments() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'book'>('book')
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingData, setBookingData] = useState({
    appointment_date: '',
    appointment_time: '',
    patient_issue: '',
    symptoms: [] as string[]
  })
  const [refiningIssue, setRefiningIssue] = useState(false)
  const [aiRefinedIssue, setAiRefinedIssue] = useState('')

  useEffect(() => {
    if (user) {
      loadDoctors()
      loadAppointments()
    }
  }, [user])

  const loadDoctors = async () => {
    setLoading(true)
    try {
      // Try to load from Supabase first
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select(`
          id,
          specialization,
          experience_years,
          consultation_fee,
          about,
          languages,
          is_available,
          average_rating,
          user_profiles!inner(full_name, avatar_url)
        `)
        .eq('is_verified', true)

      let formattedDoctors: Doctor[] = []
      
      if (!error && data && data.length > 0) {
        // Format real doctors from Supabase
        formattedDoctors = data.map((d: any) => ({
          id: d.id,
          full_name: d.user_profiles?.full_name || 'Dr.',
          specialization: d.specialization,
          experience_years: d.experience_years,
          consultation_fee: d.consultation_fee || 0,
          about: d.about,
          languages: d.languages || [],
          is_available: d.is_available,
          average_rating: d.average_rating || 0,
          avatar_url: d.user_profiles?.avatar_url,
          available_slots: generateTimeSlots()
        }))
      }
      
      // Add mock doctors (always include them for demo)
      const mockDoctors = generateMockDoctors()
      
      // Combine real and mock doctors
      setDoctors([...formattedDoctors, ...mockDoctors])
    } catch (error) {
      console.error('Error loading doctors:', error)
      // Fallback to mock doctors only
      setDoctors(generateMockDoctors())
    } finally {
      setLoading(false)
    }
  }

  const loadAppointments = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctor:doctor_profiles(
            specialization,
            user_profiles(full_name)
          )
        `)
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: true })

      if (error) throw error
      setAppointments(data || [])
    } catch (error) {
      console.error('Error loading appointments:', error)
    }
  }

  const refineIssueWithAI = async () => {
    if (!bookingData.patient_issue) return
    
    setRefiningIssue(true)
    try {
      const prompt = `Convert this patient's description into professional medical terminology for a doctor:
      "${bookingData.patient_issue}"
      
      Return only the refined medical description, no extra text.`
      
      const refined = await getAIResponse(prompt, 'You are a medical terminology expert. Be concise and professional.')
      setAiRefinedIssue(refined)
    } catch (error) {
      console.error('Error refining issue:', error)
    } finally {
      setRefiningIssue(false)
    }
  }

  const calculatePriority = async () => {
    try {
      const { data, error } = await supabase
        .rpc('calculate_appointment_priority', {
          p_issue: bookingData.patient_issue,
          p_symptoms: bookingData.symptoms
        })
      
      if (error) throw error
      return data || 'normal'
    } catch (error) {
      return 'normal'
    }
  }

  const bookAppointment = async () => {
    if (!selectedDoctor || !user) return

    try {
      const priority = await calculatePriority()
      
      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: user.id,
          doctor_id: selectedDoctor.id,
          appointment_date: bookingData.appointment_date,
          appointment_time: bookingData.appointment_time,
          patient_issue: bookingData.patient_issue,
          ai_refined_issue: aiRefinedIssue || null,
          symptoms: bookingData.symptoms,
          priority: priority
        })

      if (error) throw error

      setShowBookingModal(false)
      setSelectedDoctor(null)
      setBookingData({ appointment_date: '', appointment_time: '', patient_issue: '', symptoms: [] })
      setAiRefinedIssue('')
      
      loadAppointments()
      alert('Appointment booked successfully! Waiting for doctor confirmation.')
    } catch (error) {
      console.error('Error booking appointment:', error)
      alert('Failed to book appointment')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
        <Sidebar />
        <div className="ml-64 flex items-center justify-center h-screen">
          <Loader className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <Sidebar />
      
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-purple-400" />
              Appointments
            </h1>
            <p className="text-gray-400">Book and manage your appointments with doctors</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-white/10">
            <button
              onClick={() => setActiveTab('book')}
              className={`px-4 py-2 font-medium transition-all ${
                activeTab === 'book'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Book Appointment
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 font-medium transition-all ${
                activeTab === 'upcoming'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Upcoming ({appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-4 py-2 font-medium transition-all ${
                activeTab === 'past'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Past Appointments
            </button>
          </div>

          {/* Book Appointment Tab */}
          {activeTab === 'book' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map(doctor => (
                <div key={doctor.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      {doctor.avatar_url ? (
                        <img src={doctor.avatar_url} alt={doctor.full_name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-white text-xl font-bold">
                          {doctor.full_name.split(' ').map(n => n[0]).join('')}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate">Dr. {doctor.full_name}</h3>
                      <p className="text-purple-400 text-sm">{doctor.specialization}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-gray-300 text-xs">{doctor.average_rating.toFixed(1)}</span>
                        <span className="text-gray-500 text-xs ml-2">{doctor.experience_years}+ years</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <p className="text-gray-400 line-clamp-2">{doctor.about}</p>
                    <p className="text-gray-400">
                      <span className="text-white">Speaks:</span> {doctor.languages.join(', ')}
                    </p>
                    <p className="text-green-400 font-medium">
                      ${doctor.consultation_fee} per consultation
                    </p>
                  </div>

                  {/* Available Time Slots */}
                  {doctor.available_slots && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-400 mb-2">Available slots:</p>
                      <div className="flex flex-wrap gap-2">
                        {doctor.available_slots
                          .filter(slot => slot.available)
                          .slice(0, 3)
                          .map((slot, idx) => (
                            <span key={idx} className="px-2 py-1 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-xs">
                              {slot.date.split('-').slice(1).join('/')} {slot.time}
                            </span>
                          ))}
                        {doctor.available_slots.filter(slot => slot.available).length > 3 && (
                          <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-gray-400 text-xs">
                            +{doctor.available_slots.filter(slot => slot.available).length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setSelectedDoctor(doctor)
                      setShowBookingModal(true)
                    }}
                    disabled={!doctor.is_available}
                    className={`w-full py-2 rounded-lg transition-all ${
                      doctor.is_available
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-white/10 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {doctor.is_available ? 'Book Appointment' : 'Not Available'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming Appointments */}
          {activeTab === 'upcoming' && (
            <div className="space-y-4">
              {appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length === 0 ? (
                <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
                  <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No upcoming appointments</p>
                  <button
                    onClick={() => setActiveTab('book')}
                    className="mt-4 text-purple-400 hover:text-purple-300"
                  >
                    Book an appointment
                  </button>
                </div>
              ) : (
                appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').map(apt => (
                  <div key={apt.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Calendar className="w-10 h-10 text-purple-400" />
                        <div>
                          <h3 className="text-white font-semibold">
                            Dr. {apt.doctor?.user_profiles?.full_name} - {apt.doctor?.specialization}
                          </h3>
                          <p className="text-gray-400">
                            {new Date(apt.appointment_date).toLocaleDateString()} at {apt.appointment_time}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              apt.status === 'confirmed' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {apt.status}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              apt.priority === 'emergency' ? 'bg-red-500/20 text-red-400' :
                              apt.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {apt.priority} priority
                            </span>
                          </div>
                        </div>
                      </div>
                      {apt.status === 'confirmed' && (
                        <button className="px-4 py-2 bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 rounded-lg flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          Join Call
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Past Appointments */}
          {activeTab === 'past' && (
            <div className="space-y-4">
              {appointments.filter(a => a.status === 'completed' || a.status === 'cancelled').length === 0 ? (
                <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
                  <Clock className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No past appointments</p>
                </div>
              ) : (
                appointments.filter(a => a.status === 'completed' || a.status === 'cancelled').map(apt => (
                  <div key={apt.id} className="bg-white/5 border border-white/10 rounded-xl p-6 opacity-60">
                    <div className="flex items-center gap-4">
                      <CheckCircle className="w-10 h-10 text-gray-400" />
                      <div>
                        <h3 className="text-white font-semibold">
                          Dr. {apt.doctor?.user_profiles?.full_name} - {apt.doctor?.specialization}
                        </h3>
                        <p className="text-gray-400">
                          {new Date(apt.appointment_date).toLocaleDateString()} at {apt.appointment_time}
                        </p>
                        <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs ${
                          apt.status === 'completed' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900/50 border border-white/20 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                Book Appointment with Dr. {selectedDoctor.full_name}
              </h2>
              <button onClick={() => setShowBookingModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Select Date & Time</label>
                <select
                  value={`${bookingData.appointment_date}|${bookingData.appointment_time}`}
                  onChange={(e) => {
                    const [date, time] = e.target.value.split('|')
                    setBookingData({
                      ...bookingData,
                      appointment_date: date,
                      appointment_time: time
                    })
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="">Select a time slot</option>
                  {selectedDoctor?.available_slots
                    ?.filter(slot => slot.available)
                    .map((slot, idx) => (
                      <option key={idx} value={`${slot.date}|${slot.time}`}>
                        {new Date(slot.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {slot.time}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Describe Your Issue</label>
                <textarea
                  value={bookingData.patient_issue}
                  onChange={(e) => setBookingData({...bookingData, patient_issue: e.target.value})}
                  className="w-full h-32 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white resize-none"
                  placeholder="Please describe your symptoms or reason for consultation..."
                />
                
                <button
                  onClick={refineIssueWithAI}
                  disabled={!bookingData.patient_issue || refiningIssue}
                  className="mt-2 px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-lg text-sm flex items-center gap-2 hover:bg-purple-600/30 transition-all"
                >
                  {refiningIssue ? (
                    <Loader className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  Refine with AI (Medical Terms)
                </button>

                {aiRefinedIssue && (
                  <div className="mt-3 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                    <p className="text-cyan-400 text-xs mb-1">AI Refined Version:</p>
                    <p className="text-gray-300 text-sm">{aiRefinedIssue}</p>
                  </div>
                )}
              </div>

              <button
                onClick={bookAppointment}
                disabled={!bookingData.appointment_date || !bookingData.appointment_time || !bookingData.patient_issue}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}