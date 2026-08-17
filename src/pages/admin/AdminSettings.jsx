import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Save, AlertCircle, Server, Mail, ShieldAlert } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('platform');
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .single();
        
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found
      
      if (data) {
        setSettings(data);
      } else {
        const defaultSettings = {
          platform_name: 'SkillSwap+',
          contact_email: 'support@skillswap.com',
          welcome_bonus_ss: 100,
          platform_fee_percent: 5,
        };
        setSettings(defaultSettings);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError("Failed to load settings. Please check your database connection.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveSettings(e) {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMsg("");
      
      const { error } = await supabase
        .from('platform_settings')
        .upsert([{ id: settings.id || 1, ...settings }]);
        
      if (error) throw error;
      
      setSuccessMsg("Settings saved successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setError("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium tracking-[-0.04em] text-[#f2f4ef] mb-2">
            Settings
          </h1>
          <p className="text-sm text-[#a1a1aa]">
            Global configuration and preferences for the SkillSwap+ platform.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 p-4 rounded text-[#ff8b8b] flex items-center gap-3 mb-6">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="bg-[#c7ff39]/10 border border-[#c7ff39]/30 p-4 rounded text-[#c7ff39] flex items-center gap-3 mb-6">
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 flex justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-[#c7ff39]" />
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Settings Navigation */}
          <div className="w-full md:w-64 shrink-0 flex flex-col gap-1">
            <button 
              onClick={() => setActiveTab('platform')}
              className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium relative text-left transition-colors ${activeTab === 'platform' ? 'bg-[#c7ff39]/[0.06] text-[#c7ff39] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-1 before:bg-[#c7ff39] before:rounded-r-full' : 'text-[#a1a1aa] hover:bg-white/[0.03] hover:text-[#f2f4ef]'}`}>
              <SettingsIcon className="h-4 w-4" /> Platform Setup
            </button>
            <button 
              onClick={() => setActiveTab('moderation')}
              className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium relative text-left transition-colors ${activeTab === 'moderation' ? 'bg-[#c7ff39]/[0.06] text-[#c7ff39] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-1 before:bg-[#c7ff39] before:rounded-r-full' : 'text-[#a1a1aa] hover:bg-white/[0.03] hover:text-[#f2f4ef]'}`}>
              <ShieldAlert className="h-4 w-4" /> Moderation Rules
            </button>
            <button 
              onClick={() => setActiveTab('email')}
              className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium relative text-left transition-colors ${activeTab === 'email' ? 'bg-[#c7ff39]/[0.06] text-[#c7ff39] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-1 before:bg-[#c7ff39] before:rounded-r-full' : 'text-[#a1a1aa] hover:bg-white/[0.03] hover:text-[#f2f4ef]'}`}>
              <Mail className="h-4 w-4" /> Email Templates
            </button>
            <button 
              onClick={() => setActiveTab('system')}
              className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium relative text-left transition-colors ${activeTab === 'system' ? 'bg-[#c7ff39]/[0.06] text-[#c7ff39] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-1 before:bg-[#c7ff39] before:rounded-r-full' : 'text-[#a1a1aa] hover:bg-white/[0.03] hover:text-[#f2f4ef]'}`}>
              <Server className="h-4 w-4" /> System & Maintenance
            </button>
          </div>

          {/* Settings Form Area */}
          <div className="flex-1 space-y-6">
            <form onSubmit={handleSaveSettings}>
              {activeTab === 'platform' && (
                <div className="space-y-6">
                  <div className="bg-[#0a0d0b] border border-white/10 p-6 rounded-sm space-y-6">
                    <h2 className="text-sm font-semibold tracking-wide text-[#f2f4ef] uppercase border-b border-white/10 pb-4">
                      General Configuration
                    </h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-[#a1a1aa] mb-2">Platform Name</label>
                        <input 
                          type="text" 
                          value={settings?.platform_name || ''}
                          onChange={e => setSettings({...settings, platform_name: e.target.value})}
                          className="w-full h-10 bg-[#060807] border border-white/15 rounded-md px-4 text-sm text-[#f2f4ef] focus:outline-none focus:border-[#c7ff39]/70 focus:ring-1 focus:ring-[#c7ff39]/30 transition-all"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-[#a1a1aa] mb-2">Contact Email</label>
                        <input 
                          type="email" 
                          value={settings?.contact_email || ''}
                          onChange={e => setSettings({...settings, contact_email: e.target.value})}
                          className="w-full h-10 bg-[#060807] border border-white/15 rounded-md px-4 text-sm text-[#f2f4ef] focus:outline-none focus:border-[#c7ff39]/70 focus:ring-1 focus:ring-[#c7ff39]/30 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0a0d0b] border border-white/10 p-6 rounded-sm space-y-6">
                    <h2 className="text-sm font-semibold tracking-wide text-[#f2f4ef] uppercase border-b border-white/10 pb-4">
                      SS Credit Economy
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-[#a1a1aa] mb-2">Welcome Bonus (SS)</label>
                        <input 
                          type="number" 
                          value={settings?.welcome_bonus_ss || 0}
                          onChange={e => setSettings({...settings, welcome_bonus_ss: parseInt(e.target.value) || 0})}
                          className="w-full h-10 bg-[#060807] border border-white/15 rounded-md px-4 text-sm text-[#f2f4ef] font-mono focus:outline-none focus:border-[#c7ff39]/70 focus:ring-1 focus:ring-[#c7ff39]/30 transition-all"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-[#a1a1aa] mb-2">Platform Fee (%)</label>
                        <input 
                          type="number" 
                          value={settings?.platform_fee_percent || 0}
                          onChange={e => setSettings({...settings, platform_fee_percent: parseInt(e.target.value) || 0})}
                          className="w-full h-10 bg-[#060807] border border-white/15 rounded-md px-4 text-sm text-[#f2f4ef] font-mono focus:outline-none focus:border-[#c7ff39]/70 focus:ring-1 focus:ring-[#c7ff39]/30 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab !== 'platform' && (
                <div className="bg-[#0a0d0b] border border-white/10 p-12 rounded-sm text-center">
                  <p className="text-[#a1a1aa]">This settings section is not yet implemented in the prototype.</p>
                </div>
              )}

              <div className="mt-8 flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSaving || activeTab !== 'platform'}
                  className="h-10 px-6 bg-[#c7ff39] text-[#071008] font-semibold hover:bg-[#d2ff64] rounded-md transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-2 focus:ring-offset-[#060807] disabled:opacity-50">
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
