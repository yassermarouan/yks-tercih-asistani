import React, { useState, useEffect, useRef } from "react";
import type { AdvisorMetadata, StudentPreferencePayload } from "../types";
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";

interface Props {
  metadata: AdvisorMetadata;
  initialValues?: StudentPreferencePayload | null;
  onSubmit: (payload: StudentPreferencePayload) => void;
  loading: boolean;
}

export const StudentPreferenceForm: React.FC<Props> = ({
  metadata,
  initialValues,
  onSubmit,
  loading,
}) => {
  // Required Fields
  const [scoreType, setScoreType] = useState<string>(initialValues?.score_type || "SAY");
  const [rankInput, setRankInput] = useState<string>(
    initialValues?.rank ? Number(initialValues.rank).toLocaleString("tr-TR") : ""
  );
  const [targetPrograms, setTargetPrograms] = useState<string[]>(
    initialValues?.target_programs || []
  );

  // Optional Criteria
  const [preferredCities, setPreferredCities] = useState<string[]>(
    initialValues?.preferred_cities || []
  );
  const [universityType, setUniversityType] = useState<string>(
    initialValues?.university_type || "all"
  );
  const [teachingLanguage, setTeachingLanguage] = useState<string>(
    initialValues?.teaching_language || "all"
  );
  const [scholarship, setScholarship] = useState<string>(
    initialValues?.scholarship || "all"
  );

  // Advanced filters toggle
  const [showOptionalFilters, setShowOptionalFilters] = useState<boolean>(
    Boolean(
      (initialValues?.preferred_cities && initialValues.preferred_cities.length > 0) ||
      (initialValues?.university_type && initialValues.university_type !== "all") ||
      (initialValues?.teaching_language && initialValues.teaching_language !== "all")
    )
  );

  // Autocomplete state
  const [progSearch, setProgSearch] = useState<string>("");
  const [progDropdownOpen, setProgDropdownOpen] = useState<boolean>(false);
  const progRef = useRef<HTMLDivElement>(null);

  const [citySearch, setCitySearch] = useState<string>("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState<boolean>(false);
  const cityRef = useRef<HTMLDivElement>(null);

  const [formError, setFormError] = useState<string | null>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (progRef.current && !progRef.current.contains(e.target as Node)) {
        setProgDropdownOpen(false);
      }
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setCityDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered lists
  const filteredPrograms = metadata.popular_programs
    .filter(
      (p) =>
        p.toLowerCase().includes(progSearch.toLowerCase()) &&
        !targetPrograms.includes(p)
    )
    .slice(0, 8);

  const filteredCities = metadata.cities
    .filter(
      (c) =>
        c.toLowerCase().includes(citySearch.toLowerCase()) &&
        !preferredCities.includes(c)
    )
    .slice(0, 8);

  // Popular program suggestions based on score type
  const popularSuggestions: Record<string, string[]> = {
    SAY: ["Bilgisayar Mühendisliği", "Yazılım Mühendisliği", "Tıp", "Elektrik-Elektronik Mühendisliği", "Endüstri Mühendisliği", "Diş Hekimliği"],
    EA: ["Hukuk", "Yönetim Bilişim Sistemleri", "Psikoloji", "İktisat", "İşletme", "Siyaset Bilimi ve Uluslararası İlişkiler"],
    SÖZ: ["Özel Eğitim Öğretmenliği", "İlahiyat", "Okul Öncesi Öğretmenliği", "Tarih", "Halkla İlişkiler ve Tanıtım", "Türk Dili ve Edebiyatı"],
    DİL: ["İngilizce Mütercim ve Tercümanlık", "İngiliz Dili ve Edebiyatı", "İngilizce Öğretmenliği", "Almanca Mütercim ve Tercümanlık"],
  };

  const currentSuggestions = popularSuggestions[scoreType] || popularSuggestions.SAY;

  const cleanRank = rankInput.replace(/\./g, "").replace(/,/g, "").trim();
  const parsedRankNum = parseInt(cleanRank, 10);
  const isValidRank = !isNaN(parsedRankNum) && parsedRankNum > 0;

  const handleRankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    if (!digitsOnly) {
      setRankInput("");
      return;
    }
    const num = parseInt(digitsOnly, 10);
    setRankInput(num.toLocaleString("tr-TR"));
  };

  const handleAddProgram = (name: string) => {
    if (!targetPrograms.includes(name)) {
      setTargetPrograms([...targetPrograms, name]);
    }
    setProgSearch("");
    setProgDropdownOpen(false);
  };

  const handleRemoveProgram = (name: string) => {
    setTargetPrograms(targetPrograms.filter((p) => p !== name));
  };

  const handleAddCity = (cityName: string) => {
    if (!preferredCities.includes(cityName)) {
      setPreferredCities([...preferredCities, cityName]);
    }
    setCitySearch("");
    setCityDropdownOpen(false);
  };

  const handleRemoveCity = (cityName: string) => {
    setPreferredCities(preferredCities.filter((c) => c !== cityName));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isValidRank) {
      setFormError("Lütfen geçerli bir başarı sırası giriniz (Örnek: 45.000).");
      return;
    }

    if (targetPrograms.length === 0) {
      setFormError("Lütfen listelemek istediğiniz en az bir bölüm adı seçiniz.");
      return;
    }

    const payload: StudentPreferencePayload = {
      score_type: scoreType,
      rank: parsedRankNum,
      target_programs: targetPrograms,
      preferred_cities: preferredCities,
      university_type: universityType,
      teaching_language: teachingLanguage,
      scholarship: scholarship,
      priority: "rank",
    };

    onSubmit(payload);
  };

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-8">
      {/* Page Title & Intro */}
      <div className="text-center mb-8 sm:mb-10 space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Üniversite Tercih Danışmanı
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
          Puan türünüzü, başarı sıranızı ve ilgilendiğiniz bölümleri belirleyin; geçmiş yerleştirme verilerine dayalı kişiselleştirilmiş üniversite önerilerinizi inceleyin.
        </p>
      </div>

      {formError && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Main Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 sm:p-8 space-y-8"
      >
        {/* Step 1: Score Type & Rank */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">
              1. Sınav ve Sıralama Bilgileri
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              YKS puan türünüzü ve başarı sıranızı giriniz.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
            {/* Puan Türü Seçimi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Puan Türü
              </label>
              <div className="grid grid-cols-4 gap-2">
                {metadata.score_types.map((st) => (
                  <button
                    type="button"
                    key={st.id}
                    onClick={() => setScoreType(st.id)}
                    className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition border text-center cursor-pointer ${
                      scoreType === st.id
                        ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {st.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Başarı Sırası Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Başarı Sıranız
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={rankInput}
                  onChange={handleRankChange}
                  placeholder="Örn: 45.000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition"
                />
                {isValidRank && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {parsedRankNum.toLocaleString("tr-TR")}. sıra
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Resmi YKS veya tahmini deneme sıralamanızı yazınız.
              </p>
            </div>
          </div>
        </div>

        {/* Step 2: Target Departments */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">
              2. İlgilendiğiniz Bölümler
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tercih listenizde yer almasını istediğiniz lisans programlarını seçiniz.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {/* Selected Tags */}
            {targetPrograms.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {targetPrograms.map((progName) => (
                  <span
                    key={progName}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium"
                  >
                    <span>{progName}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveProgram(progName)}
                      className="text-blue-600 hover:text-blue-900 transition p-0.5"
                      title="Kaldır"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Department Search Autocomplete */}
            <div className="relative" ref={progRef}>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={progSearch}
                  onChange={(e) => {
                    setProgSearch(e.target.value);
                    setProgDropdownOpen(true);
                  }}
                  onFocus={() => setProgDropdownOpen(true)}
                  placeholder="Bölüm ara ve ekle (Örn: Bilgisayar Mühendisliği)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {progDropdownOpen && progSearch.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-56 overflow-y-auto py-1">
                  {filteredPrograms.length > 0 ? (
                    filteredPrograms.map((item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => handleAddProgram(item)}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition flex items-center justify-between"
                      >
                        <span>{item}</span>
                        <span className="text-xs text-blue-600 font-medium">Ekle</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-xs text-slate-500">
                      Eşleşen bölüm bulunamadı.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Popular Suggestions */}
            <div className="pt-1">
              <span className="text-xs font-medium text-slate-500 block mb-2">
                Popüler {scoreType} Bölümleri (Hızlı Ekle):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentSuggestions.map((sug) => {
                  const isSelected = targetPrograms.includes(sug);
                  return (
                    <button
                      type="button"
                      key={sug}
                      onClick={() => (isSelected ? handleRemoveProgram(sug) : handleAddProgram(sug))}
                      className={`text-xs px-2.5 py-1 rounded-lg transition border cursor-pointer ${
                        isSelected
                          ? "bg-blue-600 border-blue-600 text-white font-medium"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      {isSelected ? `✓ ${sug}` : `+ ${sug}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Optional Preferences (City, Uni Type, Language) */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setShowOptionalFilters(!showOptionalFilters)}
            className="w-full flex items-center justify-between py-2 text-left text-sm font-semibold text-slate-700 hover:text-slate-900 transition border-t border-slate-100 pt-4 cursor-pointer"
          >
            <span>Şehir ve Üniversite Tercihleri (İsteğe Bağlı)</span>
            {showOptionalFilters ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {showOptionalFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1 bg-slate-50/80 p-5 rounded-xl border border-slate-100">
              {/* Şehir Seçimi */}
              <div className="space-y-2" ref={cityRef}>
                <label className="block text-xs font-semibold text-slate-700">
                  Şehir Tercihi
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={citySearch}
                    onChange={(e) => {
                      setCitySearch(e.target.value);
                      setCityDropdownOpen(true);
                    }}
                    onFocus={() => setCityDropdownOpen(true)}
                    placeholder="Şehir ekle (Örn: İzmir)..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                  {cityDropdownOpen && citySearch.trim().length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-md z-20 max-h-44 overflow-y-auto py-1">
                      {filteredCities.map((c) => (
                        <button
                          type="button"
                          key={c}
                          onClick={() => handleAddCity(c)}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Cities */}
                {preferredCities.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {preferredCities.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700"
                      >
                        {c}
                        <button
                          type="button"
                          onClick={() => handleRemoveCity(c)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-500 block">
                    Tüm Türkiye şehirleri kapsanır.
                  </span>
                )}
              </div>

              {/* Üniversite Türü */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Üniversite Türü
                </label>
                <select
                  value={universityType}
                  onChange={(e) => setUniversityType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                >
                  <option value="all">Fark etmez (Tüm Üniversiteler)</option>
                  <option value="Devlet">Yalnızca Devlet Üniversiteleri</option>
                  <option value="Vakıf">Yalnızca Vakıf Üniversiteleri</option>
                </select>

                <label className="block text-xs font-semibold text-slate-700 pt-1">
                  Öğretim Dili
                </label>
                <select
                  value={teachingLanguage}
                  onChange={(e) => setTeachingLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                >
                  <option value="all">Fark etmez (Tüm Diller)</option>
                  <option value="Türkçe">Yalnızca Türkçe</option>
                  <option value="İngilizce">Yalnızca İngilizce</option>
                </select>

                <label className="block text-xs font-semibold text-slate-700 pt-1">
                  Burs Tercihi
                </label>
                <select
                  value={scholarship}
                  onChange={(e) => setScholarship(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                >
                  <option value="all">Fark etmez</option>
                  <option value="Ücretsiz">Ücretsiz / Tam Burslu</option>
                  <option value="%50 İndirimli">%50 İndirimli</option>
                  <option value="Ücretli">Ücretli</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm sm:text-base shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Öneriler Hazırlanıyor...</span>
              </>
            ) : (
              <>
                <span>Kişiselleştirilmiş Tercihleri Göster</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
