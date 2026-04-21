import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import html2pdf from "html2pdf.js";


// --- 🔒 SÉCURITÉ : VARIABLES D'ENVIRONNEMENT ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const MAKE_WEBHOOK_URL =
  "https://hook.eu1.make.com/3z1us12zmfbitpvy7o1wy3qda07ly7l2";
const LOGO_URL =
  "https://wblginsktosypbmhmgbr.supabase.co/storage/v1/object/public/Hakimi%20logo/hakimi.jpg";

const CAROUSEL_IMAGES = [
  "https://via.placeholder.com/1200x400/800020/ffffff?text=Bienvenue+chez+Hakimi+Plus",
  "https://via.placeholder.com/1200x400/228B22/ffffff?text=Produits+Frais+%26+Livraison+Rapide",
  "https://via.placeholder.com/1200x400/FFA500/ffffff?text=Commandez+en+ligne,+Paiement+a+la+livraison",
];

const formatAr = (val) => Number(val || 0).toLocaleString("fr-FR");

const renderFormattedText = (text) => {
  if (!text) return null;
  return text.split("\n").map((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) {
      return (
        <h3
          key={index}
          className="text-xl font-black text-[#800020] mt-8 mb-3 border-b-2 border-red-100 pb-2"
        >
          {trimmed.substring(2)}
        </h3>
      );
    } else if (trimmed.startsWith("## ")) {
      return (
        <h4 key={index} className="text-lg font-bold text-gray-800 mt-6 mb-2">
          {trimmed.substring(3)}
        </h4>
      );
    } else if (trimmed.startsWith("- ")) {
      return (
        <li key={index} className="ml-6 list-disc text-gray-600 mb-2">
          {trimmed.substring(2)}
        </li>
      );
    } else if (trimmed === "") {
      return <div key={index} className="h-3"></div>;
    } else {
      return (
        <p
          key={index}
          className="text-gray-600 text-sm md:text-base leading-relaxed mb-3"
        >
          {trimmed}
        </p>
      );
    }
  });
};

const safeDecode = (str) => {
  try {
    return decodeURIComponent(str);
  } catch (e) {
    return str;
  }
};

function ChronoPromo({ dateFin }) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const updateChrono = () => {
      const total = Date.parse(dateFin) - Date.now();
      if (total <= 0) {
        setTimeLeft("Expiré");
        return;
      }
      const d = Math.floor(total / (1000 * 60 * 60 * 24));
      const h = Math.floor((total / (1000 * 60 * 60)) % 24);
      const m = Math.floor((total / 1000 / 60) % 60);
      setTimeLeft(d > 0 ? `${d}j ${h}h ${m}m` : `${h}h ${m}m`);
    };
    updateChrono();
    const timer = setInterval(updateChrono, 60000);
    return () => clearInterval(timer);
  }, [dateFin]);
  return (
    <span className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-[10px] font-black tracking-widest animate-pulse">
      ⏳ {timeLeft}
    </span>
  );
}

export default function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMiniCart, setShowMiniCart] = useState(false);
  // --- 🚀 MOTEUR ONESIGNAL (NOTIFICATIONS PUSH) ---
 
// --- 📱 LOGIQUE PWA (INSTALLATION & MISE À JOUR) ---
const [deferredPrompt, setDeferredPrompt] = useState(null);
const [isInstallable, setIsInstallable] = useState(false);
const [isInstalled, setIsInstalled] = useState(false);
const [isIOS, setIsIOS] = useState(false);
const [showIOSPrompt, setShowIOSPrompt] = useState(false);

useEffect(() => {
  // 1. Détecter si on est sur un appareil Apple
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
  setIsIOS(isIosDevice);

  // 2. Vérifier si l'app est déjà installée
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isStandalone) {
    setIsInstalled(true);
  } else if (isIosDevice) {
    // Si c'est un iPhone non installé, on rend le bouton cliquable
    setIsInstallable(true);
  }

  // 3. Logique Android normale
  const handleBeforeInstallPrompt = (e) => {
    e.preventDefault();
    setDeferredPrompt(e);
    setIsInstallable(true);
  };

  const handleAppInstalled = () => {
    setIsInstallable(false);
    setIsInstalled(true);
    setDeferredPrompt(null);
    setShowIOSPrompt(false);
  };

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('appinstalled', handleAppInstalled);

  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.removeEventListener('appinstalled', handleAppInstalled);
  };
}, []);

const handleInstallClick = async () => {
  if (isIOS) {
    // Sur Apple, on ouvre notre joli tutoriel
    setShowIOSPrompt(true);
    return;
  }
  if (!deferredPrompt) return;
  // Sur Android, on lance le vrai menu d'installation
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') setIsInstallable(false);
  setDeferredPrompt(null);
};
// --------------------------------------------------
  // --------------------------------------------------

  const [view, setView] = useState(() => {
    const hash = window.location.hash.replace("#/", "");
    return decodeURIComponent(hash) || "accueil";
  });

  useEffect(() => {
    const currentHashDecoded = decodeURIComponent(
      window.location.hash.replace("#/", "")
    );
    if (currentHashDecoded !== view) {
      const encodedView = view
        .split("/")
        .map((part) => encodeURIComponent(part))
        .join("/");
      window.location.hash = `/${encodedView}`;
    }
    window.scrollTo(0, 0);
  }, [view]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#/", "");
      setView(safeDecode(hash) || "accueil");
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const [produits, setProduits] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [texteLivraison, setTexteLivraison] = useState("");
  const [texteConditions, setTexteConditions] = useState("");
  const [panier, setPanier] = useState(() => {
    const saved = localStorage.getItem("hakimi_panier");
    return saved ? JSON.parse(saved) : [];
  });

  const [rubriques, setRubriques] = useState([]);
  // --- 📢 BANDEAU D'URGENCE DYNAMIQUE ---
  const [messagesBanniere, setMessagesBanniere] = useState(["LIVRAISON TANA & PROVINCE"]);
  const [indexBanniere, setIndexBanniere] = useState(0);

  useEffect(() => {
    if (messagesBanniere.length <= 1) return;
    const timer = setInterval(() => {
      setIndexBanniere((prev) => (prev + 1) % messagesBanniere.length);
    }, 3000); // Change le texte toutes les 3 secondes
    return () => clearInterval(timer);
  }, [messagesBanniere]);
  const [articleActuel, setArticleActuel] = useState(() => {
    const saved = sessionStorage.getItem("hakimi_article");
    return saved ? JSON.parse(saved) : null;
  });
  useEffect(() => {
    if (articleActuel)
      sessionStorage.setItem("hakimi_article", JSON.stringify(articleActuel));
  }, [articleActuel]);

  const [produitSelectionne, setProduitSelectionne] = useState(() => {
    const saved = sessionStorage.getItem("hakimi_produit");
    return saved ? JSON.parse(saved) : null;
  });
  useEffect(() => {
    if (produitSelectionne)
      sessionStorage.setItem(
        "hakimi_produit",
        JSON.stringify(produitSelectionne)
      );
  }, [produitSelectionne]);

 // --- ÉTAT POUR LES 4 PRODUITS ALÉATOIRES ---
 const [produitsAleatoires, setProduitsAleatoires] = useState([]);

 useEffect(() => {
   if (view.startsWith("produit/") && produits.length > 0) {
     const prodId = view.split("produit/")[1];
     const prod = produits.find((p) => p.id.toString() === prodId);
     
     if (prod) {
       setProduitSelectionne(prod);
       
       // 🎲 On prend tous les autres produits, on les mélange, et on en garde 4
       const autresProduits = produits.filter(p => p.id !== prod.id);
       const melange = [...autresProduits].sort(() => 0.5 - Math.random());
       setProduitsAleatoires(melange.slice(0, 4));
       
     } else {
       setView("catalogue");
     }
   }
 }, [view, produits]);

  const [menusWeb, setMenusWeb] = useState([]);
  const [menuActuel, setMenuActuel] = useState("");
  const [sousCatActuelle, setSousCatActuelle] = useState("TOUS LES PRODUITS");

  useEffect(() => {
    if (view.startsWith("catalogue")) {
      const parts = view.split("/");
      setMenuActuel(parts[1] ? decodeURIComponent(parts[1]).trim() : "");
      setSousCatActuelle(parts[2] ? decodeURIComponent(parts[2]).trim() : "TOUS LES PRODUITS");
    } else if (view.startsWith("informatique")) {
      const parts = view.split("/");
      setMenuActuel(parts[1] ? decodeURIComponent(parts[1]).trim() : "");
      setSousCatActuelle(parts[2] ? decodeURIComponent(parts[2]).trim() : "TOUS LES PRODUITS");
    }
  }, [view]);
  useEffect(() => {
    if (window.fbq && typeof window.fbq === "function")
      window.fbq("track", "PageView");
    if (view.startsWith("produit/") && produitSelectionne) {
      document.title = `${produitSelectionne.nom} | Hakimi Plus`;
    } else if (view.startsWith("catalogue")) {
      document.title = "Notre Catalogue | Hakimi Plus";
    } else if (view === "panier") {
      document.title = `🛒 Mon Panier (${panier.length}) | Hakimi Plus`;
    } else if (view === "accueil") {
      document.title = "Hakimi Plus - Boutique en ligne à Tananarive";
    } else {
      document.title = "Hakimi Plus";
    }
  }, [view, produitSelectionne, panier.length]);

  useEffect(
    () => localStorage.setItem("hakimi_panier", JSON.stringify(panier)),
    [panier]
  );

// --- NOUVEAU : Auto-sélection du mode DIGITAL ultra-sécurisée ---
useEffect(() => {
  const hasService = panier.some(p => p.categorie_web === "Services" || p.sous_categorie_web === "Services");
  setFormClient((prev) => {
    if (hasService && prev.type_livraison !== "DIGITAL") {
      return { ...prev, type_livraison: "DIGITAL", quartier: "", canal_digital: prev.canal_digital || "WHATSAPP" };
    }
    if (!hasService && prev.type_livraison === "DIGITAL") {
      return { ...prev, type_livraison: "TANA" };
    }
    return prev;
  });
}, [panier]);

  const [searchQuery, setSearchQuery] = useState("");
  const [minCommandes, setMinCommandes] = useState({ tana: 0, province: 0 });
  const [showQuartiersDropdown, setShowQuartiersDropdown] = useState(false);
  const [maxPrice, setMaxPrice] = useState("");
  const [sortOrder, setSortOrder] = useState("");

  const searchContainerRefDesktop = useRef(null);
  const searchContainerRefMobile = useRef(null);

  useEffect(() => {
    if (!view.startsWith("catalogue")) setSearchQuery("");
  }, [view]);

  const [quartiersDb, setQuartiersDb] = useState([]);
  const [maintenanceDate, setMaintenanceDate] = useState(null);
  const [isCheckingMaintenance, setIsCheckingMaintenance] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselDynamicImages, setCarouselDynamicImages] =
    useState(CAROUSEL_IMAGES);

 // 🧠 RÉCUPÉRATION DE LA MÉMOIRE CLIENT
 const [formClient, setFormClient] = useState(() => {
  const memoire = localStorage.getItem("hakimi_client_info");
  if (memoire) return JSON.parse(memoire);
  return {
    nom: "", whatsapp: "", whatsapp2: "", type_livraison: "TANA", ville: "", quartier: "", adresse_detail: "", message_expedition: "", methode_paiement: "",
    email: "", canal_digital: "WHATSAPP" // 👈 NOUVEAU
  };
});
  const [isSubmitting, setIsSubmitting] = useState(false);
// 🧠 MÉMOIRE DE LA COMMANDE (Empêche la disparition sur mobile)
const [commandeValidee, setCommandeValidee] = useState(() => {
  const saved = sessionStorage.getItem("hakimi_commande_validee");
  return saved ? JSON.parse(saved) : null;
});

useEffect(() => {
  if (commandeValidee) {
    sessionStorage.setItem("hakimi_commande_validee", JSON.stringify(commandeValidee));
  }
}, [commandeValidee]);
  const [notificationPanier, setNotificationPanier] = useState(null);
  const [formSuivi, setFormSuivi] = useState({ whatsapp: "", numero: "" });
  const [commandeSuivi, setCommandeSuivi] = useState(null);
  const [loadingSuivi, setLoadingSuivi] = useState(false);

  useEffect(() => {
    if (view.startsWith("suivi/")) {
      const fetchSuivi = async () => {
        setLoadingSuivi(true);
        const numero = view.replace("suivi/", "");
        const { data } = await supabase
          .from("commandes_web")
          .select("*")
          .eq("numero_commande", numero)
          .maybeSingle();
        setCommandeSuivi(data);
        setLoadingSuivi(false);
      };
      fetchSuivi();
    }
  }, [view]);

  const [showWhatsApp, setShowWhatsApp] = useState(() => {
    const saved = sessionStorage.getItem("hakimi_wa_visible");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    sessionStorage.setItem("hakimi_wa_visible", JSON.stringify(showWhatsApp));
  }, [showWhatsApp]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingProducts(true);
      const { data: prods } = await supabase
        .from("produits")
        .select("*")
        .eq("afficher_web", true)
        .order("nom");
      setProduits(prods || []);
      setIsLoadingProducts(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchParams = async () => {
      try {
        const { data } = await supabase
          .from("parametres_web")
          .select("*")
          .eq("id", 1)
          .maybeSingle();
        if (data) {
          if (data.carousel_urls)
            setCarouselDynamicImages(
              data.carousel_urls.filter((url) => url && url.trim() !== "")
            );
          if (data.quartiers_json) setQuartiersDb(data.quartiers_json);
          if (data.rubriques_json) setRubriques(data.rubriques_json);
          if (data.categories_hierarchie_json)
            setMenusWeb(data.categories_hierarchie_json);
          if (data.maintenance_mode) setMaintenanceDate(data.maintenance_date);
          else setMaintenanceDate(null);
          if (data.min_commande_tana !== undefined) {
            setMinCommandes({
              tana: data.min_commande_tana || 0,
              province: data.min_commande_province || 0
            });
          }
          if (data.texte_livraison) setTexteLivraison(data.texte_livraison);
          if (data.texte_conditions) setTexteConditions(data.texte_conditions);
          if (data.bandeau_promo_json && data.bandeau_promo_json.length > 0) {
            setMessagesBanniere(data.bandeau_promo_json);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsCheckingMaintenance(false);
      }
    };
    fetchParams();
  }, []);

  const nextSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % carouselDynamicImages.length);
  const prevSlide = () =>
    setCurrentSlide((prev) =>
      prev === 0 ? carouselDynamicImages.length - 1 : prev - 1
    );

    const addToCart = (prod) => {
      // 🛡️ BOUCLIER ANTI-MÉLANGE (Physique vs Services Numériques)
      const isNouveauService = prod.categorie_web === "Services" || prod.sous_categorie_web === "Services";
      if (panier.length > 0) {
        const hasServiceInCart = panier.some(p => p.categorie_web === "Services" || p.sous_categorie_web === "Services");
        if (isNouveauService && !hasServiceInCart) {
          return alert("⚠️ Opération impossible.\nVous ne pouvez pas mélanger des services numériques (licences) avec des produits physiques. Veuillez valider votre panier actuel d'abord.");
        }
        if (!isNouveauService && hasServiceInCart) {
          return alert("⚠️ Opération impossible.\nVotre panier contient des services numériques. Vous ne pouvez pas y ajouter des produits physiques.");
        }
      }
  
      // 1. SCÉNARIO 5 : Interdiction de mélanger les paniers
      if (panier.length > 0) {
        const isPanierSurCommande = panier[0].sur_commande === true;
        const isNouveauSurCommande = prod.sur_commande === true;
        if (isPanierSurCommande !== isNouveauSurCommande) {
          return alert(
            isNouveauSurCommande
              ? "⚠️ Votre panier contient des articles en stock.\n\nPour des raisons logistiques, les pré-commandes doivent être validées séparément.\nVeuillez finaliser votre achat actuel ou vider votre panier."
              : "⚠️ Votre panier contient des articles en pré-commande.\n\nPour des raisons logistiques, les articles en stock doivent être validés séparément.\nVeuillez finaliser votre achat actuel ou vider votre panier."
          );
        }
      }
  
      if (Number(prod.stock_actuel) <= 0 && !prod.sur_commande)
        return alert("Rupture de stock.");
  
      let produitA_Ajouter = { ...prod };
      const now = new Date();
      if (
        prod.prix_promo &&
        new Date(prod.promo_debut) <= now &&
        new Date(prod.promo_fin) >= now
      ) {
        produitA_Ajouter.prix_vente = prod.prix_promo;
      }
  
      const exist = panier.find((item) => item.id === produitA_Ajouter.id);
      if (exist) {
        if (!prod.sur_commande && exist.qte >= produitA_Ajouter.stock_actuel)
          return alert("Stock maximum atteint !");
        setPanier(
          panier.map((item) =>
            item.id === produitA_Ajouter.id
              ? { ...item, qte: item.qte + 1 }
              : item
          )
        );
      } else {
        setPanier([...panier, { ...produitA_Ajouter, qte: 1 }]);
      }
      setNotificationPanier(produitA_Ajouter.nom);
      setTimeout(() => setNotificationPanier(null), 3000);
    };

  const removeFromCart = (id) =>
    setPanier(panier.filter((item) => item.id !== id));

  const updateQte = (id, change) => {
    setPanier(
      panier.map((item) => {
        if (item.id === id) {
          const newQte = item.qte + change;
          if (newQte > 0 && (item.sur_commande || newQte <= item.stock_actuel))
            return { ...item, qte: newQte };
        }
        return item;
      })
    );
  };

  // ======================================================================
  // 🟢 CALCULS SÉCURISÉS DU PANIER
  // ======================================================================
  const totalPanier = panier.reduce(
    (acc, item) => acc + Number(item.prix_vente) * item.qte,
    0
  );
  const quartierSelectionne = quartiersDb.find(
    (q) => q.nom === formClient.quartier
  );
  const fraisLivraison = quartierSelectionne
    ? Number(quartierSelectionne.frais)
    : 0;
  const totalNetAPayer = totalPanier + fraisLivraison;

  const isPanierSurCommande =
    panier.length > 0 && panier[0].sur_commande === true;
  const acompteExige = isPanierSurCommande ? Math.round(totalPanier * 0.6) : 0;
  const resteALaLivraison = isPanierSurCommande
    ? totalPanier - acompteExige + fraisLivraison
    : 0;

  const handleShippingChange = (type) => {
    const nouveauPaiement =
      type === "PROVINCE" && formClient.methode_paiement === "CASH"
        ? ""
        : formClient.methode_paiement;
    setFormClient({
      ...formClient,
      type_livraison: type,
      quartier: type === "PROVINCE" ? "PROVINCE" : "",
      methode_paiement: nouveauPaiement,
    });
    if (type === "PROVINCE") {
      const hasFrozen = panier.some(
        (item) =>
          item.sous_categorie_web &&
          item.sous_categorie_web.toLowerCase().includes("frozen")
      );
      if (hasFrozen) {
        alert(
          "❄️ Attention : Les produits surgelés ont été retirés de votre panier car ils ne peuvent pas être expédiés en province."
        );
        setPanier(
          panier.filter(
            (item) =>
              !(
                item.sous_categorie_web &&
                item.sous_categorie_web.toLowerCase().includes("frozen")
              )
          )
        );
      }
    }
  };

  const validerCommande = async (e) => {
    e.preventDefault();
    if (panier.length === 0) return alert("Votre panier est vide !");
    if (formClient.type_livraison === "TANA" && !formClient.quartier)
      return alert("Veuillez sélectionner un quartier.");
    if (formClient.type_livraison === "PROVINCE" && !formClient.ville)
      return alert("Veuillez indiquer la ville.");
    if (!formClient.methode_paiement)
      return alert("Veuillez sélectionner un moyen de paiement.");
    // --- VÉRIFICATION DU NUMÉRO PRINCIPAL ---
    const numeroEpuré = formClient.whatsapp.replace(/[^0-9]/g, "");
    const prefixesValides = ["032", "033", "034", "037", "038"];
    const prefixe = numeroEpuré.substring(0, 3);

    if (numeroEpuré.length !== 10 || !prefixesValides.includes(prefixe)) {
      return alert("⚠️ Numéro WhatsApp principal invalide.\nIl doit contenir 10 chiffres et commencer par 032, 033, 034, 037 ou 038.");
    }
// --- SÉCURITÉ : VÉRIFICATION DU MINIMUM DE COMMANDE ---
if (formClient.type_livraison === "TANA" && minCommandes.tana > 0 && totalPanier < minCommandes.tana) {
  return alert(`⚠️ Désolé ! La livraison est possible à partir de ${formatAr(minCommandes.tana)} Ar d'achat à Tana.`);
}
if (formClient.type_livraison === "PROVINCE" && minCommandes.province > 0 && totalPanier < minCommandes.province) {
  return alert(`⚠️ Désolé ! L'expédition en province est possible à partir de ${formatAr(minCommandes.province)} Ar d'achat.`);
}
    // --- VÉRIFICATION DU NUMÉRO DE SECOURS (S'IL EST REMPLI) ---
    if (formClient.whatsapp2) {
      const num2Epuré = formClient.whatsapp2.replace(/[^0-9]/g, "");
      const pref2 = num2Epuré.substring(0, 3);
      if (num2Epuré.length !== 10 || !prefixesValides.includes(pref2)) {
        return alert("⚠️ Le numéro de secours est invalide.\nIl doit contenir 10 chiffres et commencer par 032, 033, 034, 037 ou 038.");
      }
    }

    setIsSubmitting(true);
    const numeroUnique =
      "CMD-" + Math.random().toString(36).substr(2, 6).toUpperCase();
    const orderData = {
      numero_commande: numeroUnique,
      client_nom: formClient.nom,
      client_whatsapp: formClient.whatsapp,
      client_whatsapp2: formClient.whatsapp2,
      quartier:
        formClient.type_livraison === "PROVINCE"
          ? "PROVINCE"
          : formClient.quartier,
          adresse_detail:
          formClient.type_livraison === "PROVINCE"
            ? `Ville : ${formClient.ville} | Transporteur : ${formClient.message_expedition} | Adresse : ${formClient.adresse_detail}`
            : formClient.type_livraison === "DIGITAL"
            ? `LIVRAISON NUMÉRIQUE via ${formClient.canal_digital} ${formClient.canal_digital === 'EMAIL' ? '('+formClient.email+')' : ''}`
            : formClient.adresse_detail,
        articles_json: {
        articles: panier,
        methode_paiement: formClient.methode_paiement,
        type_livraison: formClient.type_livraison,
        ville_destination: formClient.ville,
        message_expedition: formClient.message_expedition,
      },
      montant_total: totalPanier,
      frais_livraison: fraisLivraison,
      statut: "En attente",
      date_commande: new Date().toISOString(),
    };

    const { error } = await supabase.from("commandes_web").insert([orderData]);
    if (error) {
      alert("Erreur de connexion. Veuillez réessayer.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (MAKE_WEBHOOK_URL) {
        await fetch(MAKE_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });
      }
    } catch (err) {}

    setCommandeValidee({
      nom: formClient.nom,
      total: totalNetAPayer,
      methode: formClient.methode_paiement,
      numero: numeroUnique,
      articles: panier,
      fraisLivraison: fraisLivraison,
    });
    // 💾 SAUVEGARDE DANS LE TÉLÉPHONE DU CLIENT
    localStorage.setItem("hakimi_client_info", JSON.stringify({
      nom: formClient.nom,
      whatsapp: formClient.whatsapp,
      whatsapp2: formClient.whatsapp2,
      type_livraison: formClient.type_livraison,
      ville: formClient.ville,
      quartier: formClient.quartier,
      adresse_detail: formClient.adresse_detail,
      methode_paiement: formClient.methode_paiement,
    }));

    setPanier([]);
    // On vide juste le message d'expédition, on garde tout le reste intact !
    setFormClient({ ...formClient, message_expedition: "" });
    setView("succes");
    setIsSubmitting(false);
  };

  let produitsFiltres = produits.filter((p) => {
    const sq = searchQuery.toLowerCase().trim();
    const isSearching = sq !== "";

    const matchSearch =
      sq === "" ||
      (p.nom || "").toLowerCase().includes(sq) ||
      (p.description || "").toLowerCase().includes(sq) ||
      (p.categorie_web || "").toLowerCase().includes(sq) ||
      (p.sous_categorie_web || "").toLowerCase().includes(sq);

    const matchPrice = maxPrice === "" || Number(p.prix_vente) <= Number(maxPrice);

    // 🔓 MAGIE : Si le client fait une recherche, on brise le bouclier et on affiche tout ce qui correspond !
    if (isSearching) {
      return matchSearch && matchPrice;
    }

    // 🛡️ NAVIGATION NORMALE : On garde les univers séparés
    const catWeb = (p.categorie_web || "").toUpperCase();
    const isTechProduct = catWeb === "INFORMATIQUE" || catWeb === "SERVICES";
    
    if (view.startsWith("informatique") && !isTechProduct) return false;
    if (view.startsWith("catalogue") && isTechProduct) return false;

    const matchMenu = menuActuel === "" || p.categorie_web === menuActuel;
    const matchSousCat =
      sousCatActuelle === "TOUS LES PRODUITS" ||
      p.sous_categorie_web === sousCatActuelle;
      
    return matchMenu && matchSousCat && matchPrice;
  });

  if (sortOrder === "asc")
    produitsFiltres.sort((a, b) => Number(a.prix_vente) - Number(b.prix_vente));
  else if (sortOrder === "desc")
    produitsFiltres.sort((a, b) => Number(b.prix_vente) - Number(a.prix_vente));

  const produitsAffiches = produitsFiltres;

  const now = new Date();
  const produitsEnValeur = produits.filter((p) => p.en_valeur === true);
  const produitsEnPromo = produits.filter((p) => {
    if (!p.prix_promo || !p.promo_debut || !p.promo_fin) return false;
    return new Date(p.promo_debut) <= now && new Date(p.promo_fin) >= now;
  });

  // ======================================================================
  // 🟢 LE REÇU PDF SÉCURISÉ (DESIGN ULTRA-PREMIUM STRIPE/APPLE)
  // ======================================================================
  const telechargerRecuPDF = () => {
    if (!commandeValidee) return;

    const articlesHTML = commandeValidee.articles.map((item, index) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 16px 0; font-size: 12px; color: #334155; font-weight: 600;">
          <span style="display:inline-block; width: 24px; color:#94a3b8; font-weight:800;">${item.qte}x</span> 
          ${item.nom}
          ${item.sur_commande ? `<br/><span style="display:inline-block; margin-top:6px; font-size:8px; background:#fff7ed; color:#ea580c; padding:4px 8px; border-radius:4px; text-transform:uppercase; font-weight:900; letter-spacing:0.5px;">📦 Pré-commande</span>` : ''}
        </td>
        <td style="padding: 16px 0; font-size: 13px; color: #0f172a; font-weight: 800; text-align: right;">
          ${formatAr(item.prix_vente * item.qte)} Ar
        </td>
      </tr>
    `).join("");

    const isCmdSurCommande = commandeValidee.articles.length > 0 && commandeValidee.articles[0].sur_commande === true;
    const totalArticles = commandeValidee.articles.reduce((acc, i) => acc + Number(i.prix_vente) * i.qte, 0);
    const fraisLiv = Number(commandeValidee.fraisLivraison || 0);
    const acompte = isCmdSurCommande ? Math.round(totalArticles * 0.6) : 0;
    const reste = isCmdSurCommande ? totalArticles - acompte + fraisLiv : 0;

    const element = document.createElement("div");
    element.innerHTML = `
      <div style="padding: 60px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #ffffff; width: 800px; box-sizing: border-box;">
        
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f8fafc; padding-bottom: 30px; margin-bottom: 40px;">
      <div>
        <img src="${LOGO_URL}" crossorigin="anonymous" style="height: 45px; object-fit: contain; margin-bottom: 8px;" />
        <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: 500;">Votre magasin en ligne<br/>Anosizato, Antananarivo<br/>034 86 972 98</p>
      </div>
          <div style="text-align: right;">
            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">REÇU DE COMMANDE</h1>
            <div style="display: inline-block; background: #f8fafc; padding: 8px 16px; border-radius: 8px; border: 1px solid #f1f5f9;">
              <span style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 2px;">N° de Suivi</span>
              <span style="font-size: 16px; font-weight: 900; color: #0f172a; letter-spacing: 1px;">${commandeValidee.numero}</span>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 40px; gap: 30px;">
          <div style="flex: 1; background: #f8fafc; padding: 24px; border-radius: 16px;">
            <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Facturé à</p>
            <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 900; color: #0f172a;">${commandeValidee.nom}</p>
            <p style="margin: 0; font-size: 12px; color: #475569; font-weight: 500;">Paiement : <strong style="color: #0f172a;">${commandeValidee.methode}</strong></p>
          </div>
          <div style="flex: 1; background: #f8fafc; padding: 24px; border-radius: 16px;">
            <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Détails de la date</p>
            <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 800; color: #0f172a;">${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            <p style="margin: 0; font-size: 12px; color: #475569; font-weight: 500;">Heure : ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        <div style="margin-bottom: 40px;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 0 0 12px 0; text-align: left; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Description des articles</th>
                <th style="padding: 0 0 12px 0; text-align: right; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Montant (Ar)</th>
              </tr>
            </thead>
            <tbody>
              ${articlesHTML}
            </tbody>
          </table>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
          <div style="width: 380px;">
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
              <span style="font-size: 13px; font-weight: 600; color: #64748b;">Sous-total</span>
              <span style="font-size: 14px; font-weight: 800; color: #0f172a;">${formatAr(totalArticles)} Ar</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 2px solid #e2e8f0;">
              <span style="font-size: 13px; font-weight: 600; color: #64748b;">Frais de livraison</span>
              <span style="font-size: 14px; font-weight: 800; color: #0f172a;">${fraisLiv === 0 ? "GRATUIT" : '+ ' + formatAr(fraisLiv) + ' Ar'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 24px; background: #0f172a; color: white; border-radius: 16px; margin-top: 16px; box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.2);">
              <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Total Net</span>
              <span style="font-size: 28px; font-weight: 900; letter-spacing: -1px;">${formatAr(commandeValidee.total)} Ar</span>
            </div>
            
            ${isCmdSurCommande ? `
              <div style="margin-top: 16px; background: #fff7ed; padding: 16px; border-radius: 12px; border: 1px dashed #fdba74;">
                <p style="margin: 0 0 12px 0; font-size: 10px; font-weight: 900; color: #c2410c; text-transform: uppercase; letter-spacing: 1px; text-align: center;">Modalités Pré-commande</p>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-size: 12px; font-weight: 700; color: #9a3412;">1. Acompte (60%) :</span>
                  <span style="font-size: 13px; font-weight: 900; color: #9a3412;">${formatAr(acompte)} Ar</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="font-size: 12px; font-weight: 600; color: #ea580c;">2. Reste à la livraison :</span>
                  <span style="font-size: 13px; font-weight: 800; color: #ea580c;">${formatAr(reste)} Ar</span>
                </div>
              </div>
            ` : ''}

          </div>
        </div>

        <div style="border-top: 1px solid #f1f5f9; padding-top: 24px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 800; color: #0f172a;">Merci pour votre confiance !</p>
          <p style="margin: 0; font-size: 10px; font-weight: 500; color: #94a3b8;">
            Ce reçu est généré automatiquement. Conservez votre numéro de suivi pour suivre l'état de votre commande sur notre site.
          </p>
        </div>

      </div>
    `;

    // 🌟 LE SECRET ANTI-PIXELISATION : scale à 4 (résolution x4)
    const options = {
      margin: 0,
      filename: `Recu_Provisoire_${commandeValidee.numero}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { 
        scale: 4, 
        useCORS: true,
        letterRendering: true,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    // Alerte pour l'UX mobile
    alert("📥 Préparation de votre reçu... Le téléchargement va démarrer dans un instant. Vérifiez vos notifications.");

    html2pdf().set(options).from(element).save();
  };
// ======================================================================
  // 🟢 GÉNÉRATION DU PDF DEPUIS LA PAGE DE SUIVI (DESIGN ULTRA PRO)
  // ======================================================================
  const genererPDFDepuisSuivi = (typeDocument) => {
    if (!commandeSuivi) return;

    const articles = commandeSuivi.articles_json?.articles || [];
    const montantArticles = Number(commandeSuivi.montant_total) || 0;
    const fraisLiv = Number(commandeSuivi.frais_livraison) || 0;
    const totalGlobal = montantArticles + fraisLiv;
    
    const modePaiement = commandeSuivi.articles_json?.methode_paiement || 'À la livraison';
    const typeLivraison = commandeSuivi.articles_json?.type_livraison === 'PROVINCE' 
      ? `Province (${commandeSuivi.articles_json?.ville_destination || 'Non spécifié'})` 
      : 'Tananarive';

    const articlesHTML = articles.map((item, index) => `
      <tr style="border-bottom: 1px solid #f3f4f6; background-color: ${index % 2 === 0 ? '#ffffff' : '#fafafa'};">
        <td style="padding: 16px 20px; font-size: 12px; color: #111827; font-weight: 800;">
          ${item.nom}
          ${item.sur_commande ? `<br/><span style="display: inline-block; margin-top: 6px; padding: 3px 8px; background: #fff7ed; color: #ea580c; border-radius: 4px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">📦 Pré-commande</span>` : ""}
        </td>
        <td style="padding: 16px 20px; font-size: 12px; color: #4b5563; text-align: center; font-weight: 900;">
          ${item.qte}
        </td>
        <td style="padding: 16px 20px; font-size: 12px; color: #6b7280; text-align: right; font-weight: 600;">
          ${formatAr(item.prix_vente)} Ar
        </td>
        <td style="padding: 16px 20px; font-size: 13px; color: #111827; text-align: right; font-weight: 900;">
          ${formatAr(item.prix_vente * item.qte)} Ar
        </td>
      </tr>
    `).join("");

    const dateAffichage = typeDocument === "FACTURE DÉFINITIVE"
      ? new Date().toLocaleDateString("fr-FR")
      : new Date(commandeSuivi.date_commande).toLocaleDateString("fr-FR");

    const colorTheme = typeDocument === "FACTURE DÉFINITIVE" ? "#0f172a" : "#800020";
    const badgeColor = commandeSuivi.statut.includes("Annulée") ? "#ef4444" : commandeSuivi.statut.includes("Livré") ? "#10b981" : "#f59e0b";

    const element = document.createElement("div");
    element.innerHTML = `
      <div style="width: 800px; padding: 50px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #fff; position: relative; overflow: hidden; box-sizing: border-box;">
        
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.04; z-index: 0; pointer-events: none;">
          <img src="${LOGO_URL}" crossorigin="anonymous" style="width: 500px; filter: grayscale(100%);" />
        </div>

        <div style="position: relative; z-index: 10;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 50px;">
            <div>
              <img src="${LOGO_URL}" crossorigin="anonymous" style="height: 65px; object-fit: contain; margin-bottom: 15px;" />
              <h2 style="margin: 0 0 5px 0; color: #111827; font-size: 20px; font-weight: 900; letter-spacing: -0.5px;">HAKIMI PLUS</h2>
              <p style="margin: 0 0 3px 0; font-size: 11px; color: #6b7280; font-weight: 600;">Alimentaire&informatique</p>
              <p style="margin: 0 0 3px 0; font-size: 11px; color: #6b7280;">Anosizato Atsinanana, Antananarivo</p>
              <p style="margin: 0; font-size: 11px; color: #6b7280;">Tél : 034 86 972 98 / 032 15 266 01</p>
            </div>
            
            <div style="text-align: right;">
              <h1 style="margin: 0 0 15px 0; font-size: 38px; font-weight: 900; color: ${colorTheme}; text-transform: uppercase; letter-spacing: 1px;">
                ${typeDocument === "FACTURE DÉFINITIVE" ? "FACTURE" : "REÇU"}
              </h1>
              
              <div style="display: inline-block; background: #f8fafc; padding: 15px 20px; border-radius: 12px; text-align: left; min-width: 220px; border: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Réf. Commande</span>
                  <span style="font-size: 12px; font-weight: 900; color: #0f172a;">${commandeSuivi.numero_commande}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Date</span>
                  <span style="font-size: 12px; font-weight: 900; color: #0f172a;">${dateAffichage}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
                  <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Statut</span>
                  <span style="font-size: 10px; font-weight: 900; color: white; background-color: ${badgeColor}; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">
                    ${commandeSuivi.statut}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 20px; margin-bottom: 40px;">
            <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 16px; padding: 25px; border-top: 5px solid ${colorTheme}; background: #fff;">
              <h3 style="margin: 0 0 15px 0; font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 900; letter-spacing: 1px;">Facturé & Livré à</h3>
              <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 900; color: #0f172a; text-transform: uppercase;">${commandeSuivi.client_nom}</p>
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #475569; line-height: 1.5;">📍 ${commandeSuivi.quartier} <br/> ${commandeSuivi.adresse_detail || ''}</p>
              <p style="margin: 0; font-size: 12px; color: #475569;">📞 WhatsApp : <strong>${commandeSuivi.client_whatsapp}</strong> ${commandeSuivi.client_whatsapp2 ? ' / ' + commandeSuivi.client_whatsapp2 : ''}</p>
            </div>
            
            <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 16px; padding: 25px; background: #f8fafc;">
              <h3 style="margin: 0 0 15px 0; font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 900; letter-spacing: 1px;">Détails Logistiques</h3>
              <div style="margin-bottom: 12px;">
                <span style="display: block; font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">Méthode de paiement</span>
                <span style="font-size: 14px; font-weight: 900; color: #0f172a;">${modePaiement}</span>
              </div>
              <div style="margin-bottom: 12px;">
                <span style="display: block; font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">Zone de livraison</span>
                <span style="font-size: 14px; font-weight: 900; color: #0f172a;">${typeLivraison}</span>
              </div>
              ${commandeSuivi.articles_json?.message_expedition ? `
                <div>
                  <span style="display: block; font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">Note d'expédition</span>
                  <span style="font-size: 12px; color: #475569; font-style: italic;">"${commandeSuivi.articles_json.message_expedition}"</span>
                </div>
              ` : ''}
            </div>
          </div>

          <div style="border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f1f5f9; border-bottom: 2px solid #e2e8f0;">
                  <th style="padding: 16px 20px; text-align: left; font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Description de l'article</th>
                  <th style="padding: 16px 20px; text-align: center; font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Qté</th>
                  <th style="padding: 16px 20px; text-align: right; font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Prix Unit.</th>
                  <th style="padding: 16px 20px; text-align: right; font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Montant Total</th>
                </tr>
              </thead>
              <tbody>
                ${articlesHTML}
              </tbody>
            </table>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="width: 45%; padding-right: 30px;">
              <h4 style="margin: 0 0 10px 0; font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 900; letter-spacing: 1px;">Conditions & Remarques</h4>
              <p style="margin: 0; font-size: 10px; color: #64748b; line-height: 1.6; text-align: justify;">
              Les articles doivent être vérifiés à la livraison. Aucun retour accepté après départ du livreur. L’acompte pour une précommande est non remboursable, sauf en cas de produit non conforme.
              </p>
            </div>
            
            <div style="width: 380px;">
              <div style="display: flex; justify-content: space-between; padding: 12px 10px; font-size: 13px; color: #475569; border-bottom: 1px solid #e2e8f0;">
                <span style="font-weight: 600;">Sous-total articles</span>
                <span style="font-weight: 900; color: #0f172a;">${formatAr(montantArticles)} Ar</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 12px 10px; font-size: 13px; color: #475569; border-bottom: 2px solid #cbd5e1;">
                <span style="font-weight: 600;">Frais de livraison / Expédition</span>
                <span style="font-weight: 900; color: #0f172a;">+ ${formatAr(fraisLiv)} Ar</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px; background-color: ${colorTheme}; border-radius: 12px; margin-top: 15px; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <span style="font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Total Net à Payer</span>
                <span style="font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">${formatAr(totalGlobal)} Ar</span>
              </div>
            </div>
          </div>

          <div style="margin-top: 80px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 25px;">
            <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 900; color: #0f172a;">Merci de votre confiance !</p>
            <p style="margin: 0; font-size: 9px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">
              Hakimi Plus - NIF : 6017743793 - STAT : 47110112023001634
            </p>
          </div>
        </div>
      </div>
    `;

    const options = {
      margin: 0,
      filename: `${typeDocument === "FACTURE DÉFINITIVE" ? "Facture" : "Recu_Provisoire"}_${commandeSuivi.numero_commande}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { 
        scale: 3, 
        useCORS: true,
        letterRendering: true
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
// Alerte pour l'UX mobile
alert("📥 Préparation de votre document... Le téléchargement va démarrer dans un instant. Vérifiez vos notifications.");
    html2pdf().set(options).from(element).save();
  };
  if (isCheckingMaintenance) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
        <div className="relative flex justify-center items-center mb-8">
          {/* Les orbites qui tournent */}
          <div className="absolute w-32 h-32 border-2 border-gray-200 border-t-[#800020] rounded-full animate-spin"></div>
          <div className="absolute w-24 h-24 border-2 border-gray-200 border-b-[#800020] rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          {/* Le logo central qui respire */}
          <img src={LOGO_URL} alt="Hakimi Plus" className="w-16 h-16 object-contain animate-pulse drop-shadow-2xl" />
        </div>
        <p className="text-[#800020] font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Initialisation...</p>
      </div>
    );
  }

  if (maintenanceDate !== null) {
    return (
      <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <span className="text-6xl md:text-8xl mb-6 animate-bounce">🚧</span>
        <h1 className="text-3xl md:text-5xl font-black text-[#800020] uppercase mb-4 tracking-tighter drop-shadow-sm">
          Site en maintenance
        </h1>
        <p className="text-lg md:text-xl font-bold text-gray-700 mb-2 max-w-lg">
          Désolé ! Hakimi Plus est temporairement indisponible pour une petite
          mise à jour de nos rayons.
        </p>
        <p className="text-md font-bold text-gray-500 mb-8">
          Nous serons de retour très vite !
        </p>
        {maintenanceDate && (
          <div className="bg-white px-8 py-6 rounded-3xl shadow-xl border-t-8 border-[#800020] transform hover:scale-105 transition">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
              Retour prévu le :
            </p>
            <p className="text-2xl md:text-3xl font-black text-red-600">
              {new Date(maintenanceDate).toLocaleString("fr-FR", {
                dateStyle: "full",
                timeStyle: "short",
              })}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans flex flex-col bg-gray-50 text-gray-800 transition-colors duration-500">
      {/* HEADER PREMIUM */}
      <header className="sticky top-0 z-50 shadow-sm border-b transition-colors duration-500 bg-white border-gray-200">
        {/* 📢 BANDEAU D'URGENCE ANIMÉ */}
        <div className="text-center py-2 text-[10px] md:text-xs font-black uppercase tracking-[0.15em] bg-[#800020] text-white relative overflow-hidden h-8 flex items-center justify-center shadow-inner">
          {messagesBanniere.map((msg, idx) => (
            <span
              key={idx}
              className={`absolute w-full px-2 transition-all duration-700 ease-in-out ${
                indexBanniere === idx
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-full"
              }`}
            >
              {msg}
            </span>
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-1 text-gray-800"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div className="flex items-center gap-2 cursor-pointer bg-white rounded-lg px-1 py-1">
              <img
                onClick={() => setView("accueil")}
                src={LOGO_URL}
                alt="Logo"
                className="h-10 md:h-16 lg:h-20 object-contain"
              />
              {/* LE BOUTON D'INSTALLATION INTELLIGENT */}
              {isInstallable && !isInstalled && (
                <button
                  onClick={handleInstallClick}
                  className="md:hidden bg-[#800020] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-md animate-pulse border border-red-900"
                >
                  Installer l'App
                </button>
              )}
            </div>
          </div>

          <nav className="hidden md:flex items-center justify-center gap-8 flex-1">
            {[
              "accueil",
              "catalogue",
              "livraison",
              "conditions",
              "informatique",
            ].map((m) => (
              <button
                key={m}
                onClick={() => setView(m)}
                className={`text-sm font-black uppercase transition-colors ${
                  view.startsWith(m)
                    ? "text-[#800020] border-b-2 border-[#800020] pb-1"
                    : "text-gray-800 hover:text-[#800020]"
                }`}
              >
                {m === "catalogue" ? "Boutique" : m}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            <div
              ref={searchContainerRefDesktop}
              className="hidden lg:flex items-center rounded-full px-4 py-2 w-64 shadow-inner transition-colors duration-500 border bg-gray-100 border-transparent"
            >
              <input
                type="text"
                placeholder="Rechercher un produit..."
                className="bg-transparent border-none outline-none text-xs font-bold w-full text-gray-800 placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value && view !== "catalogue")
                    setView("catalogue");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.target.blur();
                    if (view !== "catalogue") setView("catalogue");
                  }
                }}
              />
              <button
                onClick={() => {
                  if (searchQuery && view !== "catalogue") setView("catalogue");
                }}
                className="ml-2 transition-transform hover:scale-110 text-gray-500 hover:text-[#800020]"
                title="Lancer la recherche"
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </button>
            </div>

            <button
              onClick={() => setView("recherche_suivi")}
              className="p-2 transition-colors text-gray-800 hover:text-[#800020]"
              title="Suivre ma commande"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </button>

            <div 
              className="relative flex items-center h-full"
              onMouseEnter={() => setShowMiniCart(true)}
              onMouseLeave={() => setShowMiniCart(false)}
            >
              <button
                onClick={() => { setView("panier"); setShowMiniCart(false); }}
                className="relative p-2 transition-colors text-gray-800 hover:text-[#800020]"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {panier.length > 0 && (
                  <span className="absolute top-0 right-0 text-white text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full bg-[#800020] animate-bounce">
                    {panier.length}
                  </span>
                )}
              </button>

              {/* MINI PANIER FLOTTANT (STYLE AMAZON) */}
              {showMiniCart && (
                /* LE PONT INVISIBLE EST ICI : top-full et pt-4 (padding-top) */
                <div className="absolute right-0 top-full pt-4 w-80 z-[300]">
                  <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {panier.length === 0 ? (
                      <div className="p-8 text-center">
                        <span className="text-4xl mb-2 block drop-shadow-sm">🛒</span>
                        <p className="text-gray-400 font-bold text-sm">Votre panier est vide.</p>
                      </div>
                    ) : (
                      <>
                        <div className="max-h-64 overflow-y-auto p-4 space-y-4 no-scrollbar">
                          {panier.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 border border-gray-100 p-1">
                                {item.image_url ? (
                                  <img src={item.image_url} alt={item.nom} className="w-full h-full object-contain" />
                                ) : (
                                  <span className="text-[8px] text-gray-400 font-bold">Image</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-gray-800 truncate">{item.nom}</p>
                                <p className="text-[10px] font-bold text-gray-400 mt-0.5">Qté: {item.qte} × {formatAr(item.prix_vente)} Ar</p>
                              </div>
                              <div className="text-right shrink-0 flex flex-col items-end">
                              <p className="text-xs font-black text-[#800020]">{formatAr(item.prix_vente * item.qte)} Ar</p>
                              <button 
                                onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                                className="text-[9px] text-gray-400 hover:text-red-600 font-bold uppercase mt-1 flex items-center gap-1 transition-colors"
                              >
                                <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                                Retirer
                              </button>
                            </div>
                            </div>
                          ))}
                        </div>
                        <div className="bg-gray-50 p-4 border-t border-gray-100">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sous-total</span>
                            <span className="text-lg font-black text-[#800020]">
                              {formatAr(panier.reduce((acc, item) => acc + Number(item.prix_vente) * item.qte, 0))} Ar
                            </span>
                          </div>
                          <button 
                            onClick={() => { setView("panier"); setShowMiniCart(false); }}
                            className="w-full bg-[#800020] hover:bg-black text-white py-3.5 rounded-xl font-black uppercase text-[11px] tracking-widest transition-colors shadow-md flex justify-center items-center gap-2"
                          >
                            Aller au panier ➔
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
             
          </div>
        </div>

        {/* RECHERCHE MOBILE */}
        <div
          className="lg:hidden px-4 pb-3 max-w-7xl mx-auto w-full animate-in fade-in"
          ref={searchContainerRefMobile}
        >
          <div className="flex items-center rounded-2xl px-4 py-2.5 shadow-inner transition-colors duration-500 border bg-gray-100 border-transparent">
            <input
              type="text"
              placeholder="Rechercher un produit..."
              className="bg-transparent border-none outline-none text-sm font-bold w-full text-gray-800 placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value && view !== "catalogue")
                  setView("catalogue");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.target.blur();
                  if (view !== "catalogue") setView("catalogue");
                }
              }}
            />
            <button
              onClick={() => {
                if (searchQuery && view !== "catalogue") setView("catalogue");
              }}
              className="ml-2 transition-transform active:scale-95 text-gray-500"
            >
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </header>
      {/* MENU MOBILE MODERNE (Sleek Drawer) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[200] flex md:hidden">
          {/* Fond assombri (Backdrop) */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Panneau latéral (Drawer) */}
          <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div className="font-black text-xl italic tracking-tighter text-[#800020] flex items-center gap-3">
                <img
                  src={LOGO_URL}
                  alt="Logo"
                  className="h-8 w-8 object-contain"
                />
                HAKIMI PLUS
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-400 hover:text-red-500 text-4xl leading-none transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="flex flex-col py-6 overflow-y-auto">
              {[
                { id: "accueil", label: "Accueil" },
                { id: "catalogue", label: "Boutique" },
                { id: "livraison", label: "Livraison" },
                { id: "conditions", label: "Conditions" },
                { id: "informatique", label: "Informatique" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setView(m.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center px-8 py-4 transition-all duration-300 ${
                    view.startsWith(m.id)
                      ? "bg-gray-50 text-[#800020] border-l-4 border-[#800020]"
                      : "text-gray-400 border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-800"
                  }`}
                >
                  <span className="font-bold text-sm tracking-[0.2em] uppercase">
                    {m.label}
                  </span>
                </button>
              ))}

              <div className="mt-10 px-8">
                <button
                  onClick={() => {
                    setView("recherche_suivi");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center bg-gray-900 text-white p-4 rounded-lg font-bold uppercase text-xs tracking-[0.15em] shadow-md hover:bg-black transition-colors"
                >
                  Suivre ma commande
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow pb-12">
        {view === "accueil" && (
          <div className="animate-in fade-in duration-700 slide-in-from-bottom-4">
            {isLoadingProducts ? (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="w-10 h-10 border-4 border-[#800020] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-[#800020] font-black text-xs animate-pulse uppercase tracking-widest">
                  Chargement...
                </p>
              </div>
            ) : (
              <>
                <div className="w-full bg-gray-100 relative group aspect-[3/1] overflow-hidden flex items-center justify-center shadow-inner">
                  <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
                  {carouselDynamicImages.map((imgUrl, idx) => (
                    <img
                      key={idx}
                      src={imgUrl}
                      alt={`Promotion Hakimi Plus ${idx + 1}`}
                      loading={idx === 0 ? "eager" : "lazy"}
                      className={`absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-700 ease-in-out ${
                        currentSlide === idx
                          ? "opacity-100"
                          : "opacity-0 pointer-events-none"
                      }`}
                    />
                  ))}
                  <button
                    onClick={prevSlide}
                    onClick={prevSlide}
                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 text-[#800020] rounded-full flex items-center justify-center shadow-lg transition-all z-20 hover:scale-110 opacity-90 md:opacity-0 md:group-hover:opacity-100"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 text-[#800020] rounded-full flex items-center justify-center shadow-lg transition-all z-20 hover:scale-110 opacity-90 md:opacity-0 md:group-hover:opacity-100"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {carouselDynamicImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`h-1.5 transition-all rounded-full ${
                          currentSlide === idx
                            ? "w-8 bg-[#800020]"
                            : "w-2 bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 mt-12">
                  {produitsEnValeur.length > 0 && (
                    <div className="mb-16">
                      <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                        <span className="w-1.5 h-6 bg-[#800020] rounded-full inline-block shrink-0"></span>
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-gray-900">
                          Nos recommandations
                        </h2>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                        {produitsEnValeur.map((p) => (
                          <div
                            key={p.id}
                            className="bg-white p-3 md:p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all border border-gray-100 relative group flex flex-col justify-between"
                          >
                            <div
                              onClick={() => {
                                setProduitSelectionne(p);
                                setView("produit/" + p.id);
                              }}
                              className="cursor-pointer"
                            >
                              <div className="relative overflow-hidden aspect-square flex items-center justify-center bg-gray-50 rounded-xl mb-3 p-1">
                                {p.image_url ? (
                                  <img
                                    src={p.image_url}
                                    alt={p.nom}
                                    loading="lazy"
                                    className="max-h-full object-contain group-hover:scale-110 transition-transform duration-500"
                                  />
                                ) : (
                                  <span className="text-gray-400 text-xs font-bold">
                                    Image
                                  </span>
                                )}
                                {p.sur_commande === true && (
                                  <div className="absolute top-2 right-2 bg-orange-100 text-orange-700 text-[9px] font-black px-2 py-1 rounded shadow-sm uppercase">
                                    Pré-commande
                                  </div>
                                )}
                              </div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                                {p.categorie_web || "Divers"}
                              </p>
                              <h3
                                className={`font-semibold text-[13px] mb-2 leading-snug transition-colors ${
                                  p.sur_commande === true
                                    ? "text-orange-900 group-hover:text-orange-600"
                                    : "text-gray-800 group-hover:text-[#800020]"
                                }`}
                              >
                                {p.nom}
                              </h3>
                              {p.sur_commande === true && (
                                <p className="text-xs font-bold text-orange-600 italic mb-2">
                                  Délai :{" "}
                                  {p.delai_commande || "Dispo sous 15 jrs"}
                                </p>
                              )}
                            </div>
                            <div className="mt-2 border-t border-gray-100 pt-3">
                              <div className="mb-3">
                                {p.prix_promo &&
                                new Date(p.promo_debut) <= new Date() &&
                                new Date(p.promo_fin) >= new Date() ? (
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-bold text-gray-400 line-through">
                                      {formatAr(p.prix_vente)} Ar
                                    </p>
                                    <p
                                      className={`text-lg font-black ${
                                        Number(p.stock_actuel) <= 0 &&
                                        !p.sur_commande
                                          ? "text-gray-500"
                                          : p.sur_commande === true
                                          ? "text-orange-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {formatAr(p.prix_promo)} Ar
                                    </p>
                                  </div>
                                ) : (
                                  <p
                                    className={`text-lg font-black ${
                                      Number(p.stock_actuel) <= 0 &&
                                      !p.sur_commande
                                        ? "text-gray-500"
                                        : p.sur_commande === true
                                        ? "text-orange-600"
                                        : "text-[#800020]"
                                    }`}
                                  >
                                    {formatAr(p.prix_vente)} Ar
                                  </p>
                                )}
                              </div>
                              {Number(p.stock_actuel) <= 0 &&
                              !p.sur_commande ? (
                                <div className="w-full bg-gray-100 text-gray-400 py-2.5 rounded-xl font-black text-[10px] uppercase text-center border border-gray-200">
                                  Rupture
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(p)}
                                  className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-colors shadow-sm ${
                                    p.sur_commande === true
                                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                                      : "bg-gray-900 hover:bg-black text-white"
                                  }`}
                                >
                                  {p.sur_commande === true
                                    ? "Commander"
                                    : "Ajouter"}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {produitsEnPromo.length > 0 && (
                    <div className="mb-16 bg-red-50/50 p-6 md:p-10 rounded-[2rem] border border-red-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-8 border-b border-red-200 pb-4">
                        <span className="w-1.5 h-6 bg-red-600 rounded-full inline-block shrink-0"></span>
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-red-700">
                          Ventes Flash
                        </h2>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                        {produitsEnPromo.map((p) => (
                          <div
                            key={p.id}
                            className="bg-white p-3 md:p-5 rounded-2xl shadow-sm border border-red-100 relative flex flex-col justify-between group hover:shadow-lg transition-all"
                          >
                            <div className="absolute top-2 left-2 z-10">
                              <ChronoPromo dateFin={p.promo_fin} />
                            </div>
                            <div
                              onClick={() => {
                                setProduitSelectionne(p);
                                setView("produit/" + p.id);
                              }}
                              className="cursor-pointer mt-6"
                            >
                              <div className="relative overflow-hidden aspect-square flex items-center justify-center bg-gray-50 rounded-xl mb-3 p-1">
                                {p.image_url ? (
                                  <img
                                    src={p.image_url}
                                    alt={p.nom}
                                    loading="lazy"
                                    className="max-h-full object-contain group-hover:scale-110 transition-transform duration-500"
                                  />
                                ) : (
                                  <span className="text-gray-400 text-xs font-bold">
                                    Image
                                  </span>
                                )}
                                {p.sur_commande === true && (
                                  <div className="absolute top-2 right-2 bg-orange-100 text-orange-700 text-[9px] font-black px-2 py-1 rounded shadow-sm uppercase mt-6">
                                    Pré-commande
                                  </div>
                                )}
                              </div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                                {p.categorie_web || "Divers"}
                              </p>
                              <h3
                                className={`font-semibold text-[13px] mb-2 leading-snug transition-colors ${
                                  p.sur_commande === true
                                    ? "text-orange-900 group-hover:text-orange-600"
                                    : "text-gray-800 group-hover:text-[#800020]"
                                }`}
                              >
                                {p.nom}
                              </h3>
                            </div>
                            <div className="mt-2 border-t border-gray-100 pt-3">
                              <div className="mb-3">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-bold text-gray-400 line-through">
                                    {formatAr(p.prix_vente)} Ar
                                  </p>
                                  <p
                                    className={`text-lg font-black ${
                                      Number(p.stock_actuel) <= 0 &&
                                      !p.sur_commande
                                        ? "text-gray-500"
                                        : p.sur_commande === true
                                        ? "text-orange-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {formatAr(p.prix_promo)} Ar
                                  </p>
                                </div>
                              </div>
                              {Number(p.stock_actuel) <= 0 &&
                              !p.sur_commande ? (
                                <div className="w-full bg-gray-100 text-gray-400 py-2.5 rounded-xl font-black text-[10px] uppercase text-center border border-gray-200">
                                  Rupture
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    addToCart({
                                      ...p,
                                      prix_vente: p.prix_promo,
                                    })
                                  }
                                  className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-colors shadow-sm ${
                                    p.sur_commande === true
                                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                                      : "bg-red-600 hover:bg-red-700 text-white"
                                  }`}
                                >
                                  Profiter
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {rubriques && rubriques.length > 0 && (
                    <div className="mt-16 mb-8">
                      <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                        <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block shrink-0"></span>
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-gray-900">
                          Inspirations & Astuces
                        </h2>
                      </div>
                     
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rubriques.map((rubrique, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-all"
                          >
                            {rubrique.image_url && (
                              <img
                                src={rubrique.image_url}
                                alt={rubrique.titre}
                                className="w-full h-48 object-cover"
                              />
                            )}
                            <div className="p-6 flex-grow flex flex-col justify-between">
                              <div>
                                <span
                                  className={`text-[10px] font-black uppercase px-2 py-1 rounded-md mb-3 inline-block ${
                                    rubrique.type === "Recette"
                                      ? "bg-orange-100 text-orange-700"
                                      : "bg-blue-100 text-blue-700"
                                  }`}
                                >
                                  {rubrique.type}
                                </span>
                                <h3 className="font-black text-gray-800 text-xl mb-2">
                                  {rubrique.titre}
                                </h3>
                                <p className="text-gray-500 text-sm mb-4 line-clamp-3">
                                  {rubrique.description}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  setArticleActuel(rubrique);
                                  setView("article");
                                }}
                                className="text-[#800020] font-black uppercase text-xs text-left hover:underline"
                              >
                                Lire la suite ➔
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-center mt-16 mb-8">
                    <button
                      onClick={() => setView("catalogue")}
                      className="bg-gray-900 text-white px-10 py-4 rounded-xl font-bold tracking-widest uppercase shadow-lg hover:bg-black transition text-xs"
                    >
                      Parcourir le catalogue
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      {/* ======================================================= */}
        {/* VUE : CATALOGUE (DESIGN UBER EATS) */}
        {/* ======================================================= */}
        {(view.startsWith("catalogue") || view.startsWith("informatique")) && (
          <div className="max-w-7xl mx-auto px-4 mt-4 mb-12 animate-in fade-in duration-500">
            {/* TITRE ÉPURÉ */}
            <div className="flex items-center gap-3 mb-6">
              <span className="w-1.5 h-6 bg-gray-900 rounded-full inline-block shrink-0"></span>
              <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                {menuActuel || "Notre Catalogue"}
              </h2>
            </div>

          {/* CATÉGORIES PRINCIPALES (Séparées par univers) */}
          <div className="flex overflow-x-auto gap-3 mb-4 pb-2 no-scrollbar" style={{ scrollSnapType: "x mandatory" }}>
              <button
                onClick={() => setView(view.startsWith("informatique") ? "informatique" : "catalogue")}
                className={`whitespace-nowrap shrink-0 snap-start px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                  menuActuel === ""
                    ? "bg-gray-900 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Tous
              </button>
              {menusWeb
                .filter((menu) => {
                  const nom = (menu.PARENT || menu.parent).toUpperCase();
                  const isTech = nom === "INFORMATIQUE" || nom === "SERVICES";
                  // On cache l'informatique de la boutique, et la boutique de l'informatique
                  return view.startsWith("informatique") ? isTech : !isTech;
                })
                .map((menu, idx) => {
                  const nomMenu = menu.PARENT || menu.parent;
                  const isSurCommande = nomMenu.toUpperCase() === "SUR COMMANDE";
                  const prefixeBase = view.startsWith("informatique") ? "informatique" : "catalogue";
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => setView(`${prefixeBase}/` + nomMenu)}
                      className={`whitespace-nowrap shrink-0 snap-start px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                        menuActuel === nomMenu
                          ? (isSurCommande ? "bg-[#ea580c] text-white shadow-md border-transparent" : "bg-gray-900 text-white shadow-md border-transparent")
                          : (isSurCommande ? "bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100" : "bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200")
                      }`}
                    >
                      {nomMenu}
                    </button>
                  );
                })}
            </div>

            {/* SOUS-CATÉGORIES (Boutons Pilules) */}
            {menuActuel && (
              <div
                className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar border-b border-gray-100"
                style={{ scrollSnapType: "x mandatory" }}
              >
                <button
                  onClick={() => setView(`${view.startsWith("informatique") ? "informatique" : "catalogue"}/${menuActuel}`)}
                  className={`whitespace-nowrap shrink-0 snap-start px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all border ${
                    sousCatActuelle === "TOUS LES PRODUITS"
                      ? "bg-white text-gray-900 border-gray-900 shadow-sm"
                      : "bg-white text-gray-400 border-gray-200 hover:text-gray-800"
                  }`}
                >
                  Voir Tout
                </button>
                {menusWeb
                  .filter((m) => (m.PARENT || m.parent) === menuActuel)
                  .map((match) =>
                    (match.sous_categories || match.enfants || []).map(
                      (sc, idx) => (
                        <button
                          key={idx}
                          onClick={() =>
                            setView(`${view.startsWith("informatique") ? "informatique" : "catalogue"}/${menuActuel}/${sc}`)
                          }
                          className={`whitespace-nowrap shrink-0 snap-start px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all border ${
                            sousCatActuelle === sc
                              ? "bg-white text-gray-900 border-gray-900 shadow-sm"
                              : "bg-white text-gray-400 border-gray-200 hover:text-gray-800"
                          }`}
                        >
                          {sc}
                        </button>
                      )
                    )
                  )}
              </div>
            )}
            {/* TRI ET RECHERCHE */}
            <div className="mb-6 flex justify-end">
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-40">
                  <input
                    type="number"
                    placeholder="Prix Max"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-bold text-gray-800 focus:border-gray-900 transition-colors"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">
                    Ar
                  </span>
                </div>
                <select
                  className="flex-1 md:w-48 p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-bold text-gray-700 cursor-pointer focus:border-gray-900 transition-colors"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="">Trier par prix...</option>
                  <option value="asc">Croissant ⬆️</option>
                  <option value="desc">Décroissant ⬇️</option>
                </select>
              </div>
            </div>

            {/* GRILLE DES PRODUITS */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {produitsAffiches.map((p) => {
                const enRupture = Number(p.stock_actuel) <= 0;
                return (
                  <div
                    key={p.id}
                    className={`bg-white p-3 rounded-2xl border flex flex-col justify-between transition-colors group relative overflow-hidden ${
                      p.sur_commande === true
                        ? "border-orange-100"
                        : "border-gray-100"
                    } ${
                      enRupture && !p.sur_commande
                        ? "opacity-70"
                        : "hover:border-gray-300 shadow-sm"
                    }`}
                  >
                    <div
                      onClick={() => {
                        setProduitSelectionne(p);
                        setView("produit/" + p.id);
                      }}
                      className="cursor-pointer"
                    >
                      <div className="relative overflow-hidden aspect-square flex items-center justify-center bg-white rounded-xl mb-3">
                        {p.image_url ? (
                         <img
                         src={p.image_url}
                         alt={p.nom}
                         loading="lazy"
                         className="max-h-full object-contain transform-gpu will-change-transform group-hover:scale-105 transition-transform duration-300"
                       />
                        ) : (
                          <span className="text-gray-300 text-xs font-bold">
                            Image
                          </span>
                        )}
                        {p.sur_commande === true && (
                          <div className="absolute top-2 right-2 bg-orange-100 text-orange-700 text-[9px] font-black px-2 py-1 rounded-full uppercase">
                            Pré-commande
                          </div>
                        )}
                      </div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">
                        {p.categorie_web || "Divers"}
                      </p>

                      {/* LA NOUVELLE POLICE PLUS FINE ET ÉLÉGANTE */}
                      <h3
                        className={`font-semibold text-[13px] mb-2 leading-snug transition-colors ${
                          p.sur_commande === true
                            ? "text-orange-900 group-hover:text-orange-600"
                            : "text-gray-900"
                        }`}
                      >
                        {p.nom}
                      </h3>

                      {p.sur_commande === true && (
                        <p className="text-[10px] font-bold text-orange-600 mb-2">
                          Dispo : {p.delai_commande || "15 jrs"}
                        </p>
                      )}
                    </div>
                    <div className="mt-1 pt-2">
                      <div className="mb-2">
                        {p.prix_promo &&
                        new Date(p.promo_debut) <= new Date() &&
                        new Date(p.promo_fin) >= new Date() ? (
                          <div className="flex flex-col">
                            <p className="text-[10px] font-medium text-gray-400 line-through">
                              {formatAr(p.prix_vente)} Ar
                            </p>
                            <p
                              className={`text-base font-black ${
                                enRupture && !p.sur_commande
                                  ? "text-gray-500"
                                  : p.sur_commande === true
                                  ? "text-orange-600"
                                  : "text-gray-900"
                              }`}
                            >
                              {formatAr(p.prix_promo)} Ar
                            </p>
                          </div>
                        ) : (
                          <p
                            className={`text-base font-black ${
                              enRupture && !p.sur_commande
                                ? "text-gray-500"
                                : p.sur_commande === true
                                ? "text-orange-600"
                                : "text-gray-900"
                            }`}
                          >
                            {formatAr(p.prix_vente)} Ar
                          </p>
                        )}
                      </div>

                      {/* BOUTON AJOUTER STYLE UBER EATS */}
                      {enRupture && !p.sur_commande ? (
                        <div className="w-full bg-gray-50 text-gray-400 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider text-center">
                          Épuisé
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(p)}
                          className={`w-full py-2.5 rounded-xl font-bold text-[11px] transition-colors ${
                            p.sur_commande === true
                              ? "bg-orange-50 hover:bg-orange-100 text-orange-700"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                          }`}
                        >
                          {p.sur_commande === true ? "Commander" : "Ajouter"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {isLoadingProducts && (
              <div className="col-span-full flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin mb-4"></div>
              </div>
            )}
            {!isLoadingProducts && produits.length === 0 && (
              <div className="col-span-full text-center py-16">
                <p className="text-gray-500 font-medium text-sm">
                  Aucun produit disponible.
                </p>
              </div>
            )}
            {!isLoadingProducts &&
              produits.length > 0 &&
              produitsAffiches.length === 0 && (
                <div className="col-span-full text-center py-16 flex flex-col items-center">
                  <p className="text-gray-500 font-medium text-sm">
                    Aucun résultat trouvé.
                  </p>
                </div>
              )}
          </div>
        )}
        {/* ======================================================= */}
        {/* VUE : ARTICLE BLOG */}
        {/* ======================================================= */}
        {view === "article" && articleActuel && (
          <div className="max-w-3xl mx-auto px-4 mt-8 mb-16">
            <button
              onClick={() => setView("accueil")}
              className="text-gray-500 font-bold text-sm mb-6 flex items-center gap-2 hover:text-[#800020] transition"
            >
              ⬅️ Retour à l'accueil
            </button>
            <article className="bg-white rounded-[2rem] shadow-md border border-gray-100 overflow-hidden">
              {articleActuel.image_url && (
                <img
                  src={articleActuel.image_url}
                  alt={articleActuel.titre}
                  className="w-full h-64 md:h-96 object-cover"
                />
              )}
              <div className="p-8 md:p-12">
                <span
                  className={`text-xs font-black uppercase px-3 py-1 rounded-lg mb-4 inline-block ${
                    articleActuel.type === "Recette"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {articleActuel.type}
                </span>
                <h1 className="text-3xl md:text-4xl font-black text-gray-800 mb-6 leading-tight">
                  {articleActuel.titre}
                </h1>
                <div className="text-gray-600 leading-relaxed space-y-4 whitespace-pre-wrap">
                  {articleActuel.contenu}
                </div>
              </div>
            </article>
          </div>
        )}

        {/* ======================================================= */}
        {/* VUE : DÉTAIL PRODUIT */}
        {/* ======================================================= */}
        {view.startsWith("produit/") && produitSelectionne && (
          <div className="max-w-4xl mx-auto px-4 mt-8">
            <button
              onClick={() => setView("catalogue")}
              className="mb-6 font-bold text-gray-500 hover:text-[#800020] flex items-center gap-2 transition"
            >
              ← Retour au catalogue
            </button>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
              <div className="md:w-1/2 bg-gray-50 flex items-center justify-center p-6">
                {produitSelectionne.image_url ? (
                  <img
                    src={produitSelectionne.image_url}
                    alt={produitSelectionne.nom}
                    className="w-full max-h-96 object-contain rounded-2xl shadow-sm"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 rounded-2xl flex items-center justify-center text-gray-400 font-bold">
                    Image Indisponible
                  </div>
                )}
              </div>
              <div className="md:w-1/2 p-6 md:p-10 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    {produitSelectionne.categorie_web || "Divers"}
                  </p>
                  <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-4">
                    {produitSelectionne.nom}
                  </h2>
                  <div className="mb-6">
                    {produitSelectionne.prix_promo &&
                    new Date(produitSelectionne.promo_debut) <= new Date() &&
                    new Date(produitSelectionne.promo_fin) >= new Date() ? (
                      <div className="flex items-center gap-3">
                        <p className="text-xl font-bold text-gray-400 line-through">
                          {formatAr(produitSelectionne.prix_vente)} Ar
                        </p>
                        <p className="text-3xl font-black text-red-600">
                          {formatAr(produitSelectionne.prix_promo)} Ar
                        </p>
                        <span className="bg-red-600 text-white text-[10px] px-2 py-1 rounded-lg font-black uppercase animate-pulse">
                          Promo !
                        </span>
                      </div>
                    ) : (
                      <p className="text-3xl font-black text-[#800020]">
                        {formatAr(produitSelectionne.prix_vente)} Ar
                      </p>
                    )}
                  </div>
                  <div className="mb-8">
                    <h3 className="text-sm font-black uppercase text-gray-800 mb-2 border-b border-gray-100 pb-2">
                      Description
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {produitSelectionne.description ||
                        "Aucune description détaillée pour ce produit."}
                    </p>
                  </div>
                </div>
                <div className="mt-auto pt-6 border-t border-gray-100">
                  {produitSelectionne.sur_commande && (
                    <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl mb-4">
                      <p className="text-xs font-bold text-orange-800">
                        ⏱️{" "}
                        {produitSelectionne.delai_commande ||
                          "Disponible sous 15 jours"}
                      </p>
                      <p className="text-[10px] text-orange-600 mt-1">
                        Un acompte de <strong>60%</strong> vous sera demandé
                        après validation.
                      </p>
                    </div>
                  )}
                  {Number(produitSelectionne.stock_actuel) <= 0 &&
                  !produitSelectionne.sur_commande ? (
                    <div className="w-full bg-gray-200 text-gray-600 py-4 rounded-xl font-black text-sm uppercase text-center border border-gray-300">
                      {produitSelectionne.texte_rupture || "Rupture de stock"}
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(produitSelectionne)}
                      className={`w-full text-white py-4 rounded-xl font-black text-sm uppercase transition shadow-lg flex justify-center items-center gap-3 ${
                        produitSelectionne.sur_commande
                          ? "bg-orange-500 hover:bg-orange-600"
                          : "bg-[#800020] hover:bg-black"
                      }`}
                    >
                      {produitSelectionne.sur_commande
                        ? "📦 Commander cet article"
                        : "🛒 Ajouter au panier"}
                    </button>
                  )}
                </div>
              </div>
            </div>
            {/* 🎁 SECTION CROSS-SELLING (ACHATS COMPULSIFS ALÉATOIRES) 🎁 */}
            {produitsAleatoires.length > 0 && (
              <div className="mt-12 mb-8 border-t border-gray-100 pt-8 animate-in fade-in duration-500">
                <h3 className="text-lg md:text-xl font-black uppercase text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-[#800020] rounded-full inline-block"></span>
                  Vous aimerez aussi...
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {produitsAleatoires.map((p) => {
                    const enRupture = Number(p.stock_actuel) <= 0;
                    return (
                      <div
                        key={p.id}
                        className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col justify-between hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer group"
                        onClick={() => {
                          setProduitSelectionne(p);
                          setView("produit/" + p.id);
                          // On remonte tout en haut doucement quand il clique
                          window.scrollTo({ top: 0, behavior: "smooth" }); 
                        }}
                      >
                        <div className="relative overflow-hidden aspect-square flex items-center justify-center bg-gray-50 rounded-xl mb-3">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.nom}
                              loading="lazy"
                              className="max-h-full object-contain group-hover:scale-110 transition-transform duration-500 p-1"
                            />
                          ) : (
                            <span className="text-gray-300 text-xs font-bold">Image</span>
                          )}
                          {p.sur_commande === true && (
                            <div className="absolute top-2 right-2 bg-orange-100 text-orange-700 text-[9px] font-black px-2 py-1 rounded shadow-sm uppercase">
                              Pré-commande
                            </div>
                          )}
                        </div>
                        
                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">
                          {p.categorie_web || "Divers"}
                        </p>
                        
                        <h3 className="font-semibold text-[12px] mb-2 leading-snug text-gray-800 group-hover:text-[#800020] transition-colors line-clamp-2">
                          {p.nom}
                        </h3>
                        
                        <div className="mt-auto pt-2 border-t border-gray-50">
                          {p.prix_promo && new Date(p.promo_debut) <= new Date() && new Date(p.promo_fin) >= new Date() ? (
                            <p className="text-sm font-black text-red-600">
                              {formatAr(p.prix_promo)} Ar
                            </p>
                          ) : (
                            <p className={`text-sm font-black ${enRupture && !p.sur_commande ? "text-gray-400 line-through" : "text-gray-900"}`}>
                              {formatAr(p.prix_vente)} Ar
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================= */}
        {/* VUE : PANIER (DESIGN PRO & COMPACT) */}
        {/* ======================================================= */}
        {view === "panier" && (
          <div className="max-w-6xl mx-auto px-4 mt-8 mb-16 animate-in fade-in duration-300">
            <div className="flex flex-wrap justify-between items-center mb-8 gap-4 border-b border-gray-200 pb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setView("catalogue")}
                  className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#800020] transition-colors bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm"
                >
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    ></path>
                  </svg>
                  Continuer mes achats
                </button>
                <h2 className="text-2xl md:text-3xl font-black uppercase text-gray-900 hidden md:block">
                  Mon Panier
                </h2>
              </div>
              {panier.length > 0 && (
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Êtes-vous sûr de vouloir vider votre panier ?"
                      )
                    )
                      setPanier([]);
                  }}
                  className="flex items-center gap-2 text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 transition-colors bg-red-50 border border-red-200 px-3 py-2 rounded-lg"
                >
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    ></path>
                  </svg>
                  Vider le panier
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              <div className="lg:col-span-7 space-y-4">
                {panier.length === 0 ? (
                  <div className="bg-white p-12 rounded-xl shadow-sm text-center border border-gray-100 flex flex-col items-center">
                    <span className="text-5xl mb-4 drop-shadow-sm">🛒</span>
                    <p className="text-gray-500 font-bold mb-6 text-lg">
                      Votre panier est vide.
                    </p>
                    <button
                      onClick={() => setView("catalogue")}
                      className="bg-[#800020] text-white px-8 py-3 rounded-lg font-black uppercase text-sm hover:bg-gray-900 transition shadow-md"
                    >
                      Découvrir nos produits
                    </button>
                  </div>
                ) : (
                  panier.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between gap-3 hover:shadow-md transition-shadow"
                    >
                      <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border border-gray-100">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.nom}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <span className="text-[10px] text-gray-400 font-bold">
                            Sans image
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-900 text-sm truncate uppercase tracking-tight">
                          {item.nom}
                        </p>
                        <p className="text-xs text-gray-500 font-bold mt-0.5">
                          {formatAr(item.prix_vente)} Ar / unité
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-md border border-gray-200 shrink-0">
                        <button
                          onClick={() => updateQte(item.id, -1)}
                          className="w-7 h-7 flex items-center justify-center font-bold bg-white rounded shadow-sm text-gray-600 hover:text-[#800020] hover:bg-gray-50 transition-colors"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-black text-sm text-gray-800">
                          {item.qte}
                        </span>
                        <button
                          onClick={() => updateQte(item.id, 1)}
                          className="w-7 h-7 flex items-center justify-center font-bold bg-white rounded shadow-sm text-gray-600 hover:text-green-600 hover:bg-gray-50 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right w-20 md:w-24 shrink-0 flex flex-col items-end">
                        <p className="font-black text-[#800020] text-sm md:text-base">
                          {formatAr(item.prix_vente * item.qte)} Ar
                        </p>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-[10px] text-gray-400 hover:text-red-600 font-bold uppercase mt-1 flex items-center gap-1 transition-colors"
                        >
                          <svg
                            width="10"
                            height="10"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            ></path>
                          </svg>
                          Retirer
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {panier.length > 0 && (
                <div className="lg:col-span-5">
                  <div className="bg-white p-5 md:p-6 rounded-xl shadow-lg border border-gray-100 sticky top-24">
                    <h3 className="font-black uppercase text-gray-900 mb-5 border-b border-gray-100 pb-3 flex items-center gap-2">
                      <svg
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                      Validation Rapide
                    </h3>

                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6 shadow-sm">
                      <div className="bg-gray-50 p-4 border-b border-gray-200">
                        <div className="flex justify-between items-center text-sm font-bold text-gray-600 mb-1">
                          <span>Montant des articles</span>
                          <span>{formatAr(totalPanier)} Ar</span>
                        </div>
                        {formClient.quartier && (
                          <div className="flex justify-between items-center text-sm font-bold text-gray-600">
                            <span>Frais de livraison</span>
                            <span>+ {formatAr(fraisLivraison)} Ar</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200">
                          <span className="text-xs font-black text-gray-900 uppercase tracking-widest">
                            Total Global
                          </span>
                          <span className="text-2xl font-black text-[#800020] tracking-tighter">
                            {formatAr(totalNetAPayer)} Ar
                          </span>
                        </div>
                      </div>

                      {isPanierSurCommande ? (
                        <div className="p-4 bg-white">
                          <p className="text-[10px] font-black text-[#800020] uppercase tracking-widest mb-3 border-b pb-2 text-center">
                            Échéancier de paiement (Pré-commande)
                          </p>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                              <div>
                                <span className="block text-[11px] font-black text-orange-900 uppercase">
                                  1. Acompte de réservation
                                </span>
                                <span className="text-[9px] font-bold text-orange-700">
                                  60% des articles
                                </span>
                              </div>
                              <span className="text-sm font-black text-orange-700">
                                {formatAr(acompteExige)} Ar
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 border border-gray-100 rounded-lg shadow-sm">
                              <div>
                                <span className="block text-[11px] font-black text-gray-800 uppercase">
                                  2. À la réception
                                </span>
                                <span className="text-[9px] font-bold text-gray-500">
                                  Reste 40% + Frais de livraison
                                </span>
                              </div>
                              <span className="text-sm font-black text-gray-800">
                                {formatAr(resteALaLivraison)} Ar
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-white">
                          <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg border border-gray-200">
                            <span className="text-xs font-black text-[#800020] uppercase tracking-widest">
                              NET À PAYER
                            </span>
                            <span className="text-2xl font-black text-[#800020] tracking-tighter">
                              {formatAr(totalNetAPayer)} Ar
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <form onSubmit={validerCommande} className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                          Nom Complet *
                        </label>
                        <input
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-bold text-sm text-gray-800 outline-none focus:border-[#800020] transition-colors"
                          placeholder="Ex: Rabe Rakoto"
                          value={formClient.nom}
                          onChange={(e) =>
                            setFormClient({
                              ...formClient,
                              nom: e.target.value,
                            })
                          }
                          required
                          disabled={isSubmitting}
                    />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-green-600 uppercase tracking-wider block mb-1 flex items-center gap-1">
                            WhatsApp *
                          </label>
                          <input
                            type="tel"
                            className="w-full p-2.5 bg-green-50 border border-green-200 text-green-800 rounded-lg font-bold text-sm outline-none placeholder-green-300 focus:border-green-500 transition-colors"
                            placeholder="034 00..."
                            value={formClient.whatsapp}
                            onChange={(e) =>
                              setFormClient({
                                ...formClient,
                                whatsapp: e.target.value,
                              })
                            }
                            required
                            disabled={isSubmitting}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                            Tél. Secours
                          </label>
                          <input
                            type="tel"
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-bold text-sm text-gray-800 outline-none focus:border-gray-400 transition-colors"
                            placeholder="Optionnel"
                            value={formClient.whatsapp2}
                            onChange={(e) =>
                              setFormClient({
                                ...formClient,
                                whatsapp2: e.target.value,
                              })
                            }
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                      <div className="pt-2 border-t border-gray-100 mt-4">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                          Zone de livraison *
                        </label>
                        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                          {panier.some(p => p.categorie_web === "Services" || p.sous_categorie_web === "Services") ? (
                            <button type="button" className="flex-1 py-1.5 rounded-md font-black text-[11px] uppercase bg-white text-purple-600 shadow-sm cursor-default">
                              💻 Envoi Numérique (Obligatoire)
                            </button>
                          ) : (
                            <>
                              <button type="button" onClick={() => handleShippingChange("TANA")} className={`flex-1 py-1.5 rounded-md font-black text-[11px] uppercase transition-all ${formClient.type_livraison === "TANA" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>📍 Tana</button>
                              <button type="button" onClick={() => handleShippingChange("PROVINCE")} className={`flex-1 py-1.5 rounded-md font-black text-[11px] uppercase transition-all ${formClient.type_livraison === "PROVINCE" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>🚚 Province</button>
                            </>
                          )}
                        </div>
                      </div>
                      {formClient.type_livraison === "TANA" ? (
                        <div className="space-y-3">
                          <div className="relative">
                            <input
                              type="text"
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-bold outline-none focus:border-[#800020] transition-colors"
                              placeholder="🔍 Taper ou choisir un quartier..."
                              required
                              value={formClient.quartier}
                              onChange={(e) => {
                                setFormClient({ ...formClient, quartier: e.target.value });
                                setShowQuartiersDropdown(true);
                              }}
                              onFocus={() => setShowQuartiersDropdown(true)}
                              onBlur={() => setTimeout(() => setShowQuartiersDropdown(false), 200)}
                              disabled={isSubmitting}
                              autoComplete="off"
                            />
                            {showQuartiersDropdown && (
                              <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-gray-100">
                                {quartiersDb
                                  .filter((q) => q.nom.toLowerCase().includes(formClient.quartier.toLowerCase()))
                                  .map((q) => (
                                    <li
                                      key={q.nom}
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => {
                                        setFormClient({ ...formClient, quartier: q.nom });
                                        setShowQuartiersDropdown(false);
                                      }}
                                      className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center transition-colors"
                                    >
                                      <span className="font-bold text-gray-800">{q.nom}</span>
                                      <span className="text-xs font-black text-[#800020]">+{formatAr(q.frais)} Ar</span>
                                    </li>
                                  ))}
                                {quartiersDb.filter((q) => q.nom.toLowerCase().includes(formClient.quartier.toLowerCase())).length === 0 && (
                                  <li className="p-3 text-center text-gray-400 text-sm font-bold">Aucun quartier trouvé</li>
                                )}
                              </ul>
                            )}
                          </div>
                          <textarea
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-medium text-sm text-gray-800 outline-none h-14 resize-none focus:border-[#800020] transition-colors"
                            placeholder="Précisions: Lot, portail, bâtiment..."
                            value={formClient.adresse_detail}
                            onChange={(e) => setFormClient({ ...formClient, adresse_detail: e.target.value })}
                            required
                            disabled={isSubmitting}
                          />
                        </div>
                      ) : formClient.type_livraison === "PROVINCE" ? (
                        <div className="space-y-3">
                          <input
                            className="w-full p-2.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg font-bold text-sm outline-none placeholder-blue-300 focus:border-blue-500 transition-colors"
                            placeholder="Ville de destination *"
                            value={formClient.ville}
                            onChange={(e) => setFormClient({ ...formClient, ville: e.target.value })}
                            required
                            disabled={isSubmitting}
                          />
                          <textarea
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-medium text-sm text-gray-800 outline-none h-14 resize-none focus:border-blue-500 transition-colors"
                            placeholder="Transporteur préféré, agence..."
                            value={formClient.message_expedition}
                            onChange={(e) => setFormClient({ ...formClient, message_expedition: e.target.value })}
                            disabled={isSubmitting}
                          />
                        </div>
                      ) : formClient.type_livraison === "DIGITAL" ? (
                        <div className="space-y-3 bg-purple-50 p-4 rounded-xl border border-purple-100 mt-3">
                          <label className="text-[10px] font-bold text-purple-800 uppercase block mb-1">Recevoir la commande par :</label>
                          <div className="flex gap-2 mb-2">
                            <button type="button" onClick={() => setFormClient({...formClient, canal_digital: 'WHATSAPP'})} className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase transition-all ${formClient.canal_digital === 'WHATSAPP' ? 'bg-green-500 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'}`}>💬 WhatsApp</button>
                            <button type="button" onClick={() => setFormClient({...formClient, canal_digital: 'EMAIL'})} className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase transition-all ${formClient.canal_digital === 'EMAIL' ? 'bg-blue-500 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'}`}>📧 Email</button>
                          </div>
                          {formClient.canal_digital === 'EMAIL' ? (
                            <input type="email" placeholder="Votre adresse Email *" className="w-full p-3 bg-white border border-purple-200 rounded-lg outline-none font-bold text-sm text-gray-800 focus:border-purple-500" value={formClient.email} onChange={e => setFormClient({...formClient, email: e.target.value})} required disabled={isSubmitting} />
                          ) : (
                            <p className="text-xs font-bold text-purple-700 bg-white p-2 rounded border border-purple-100 text-center">La livraison sera envoyée sur le numéro WhatsApp renseigné en haut.</p>
                          )}
                        </div>
                      ) : null}
                    <div className="pt-2 border-t border-gray-100 mt-4">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                        Moyen de Paiement *
                      </label>
                        <div className="flex gap-2">
                          {formClient.type_livraison === "TANA" && (
                            <button
                              type="button"
                              onClick={() =>
                                setFormClient({
                                  ...formClient,
                                  methode_paiement: "CASH",
                                })
                              }
                              className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase transition-all border ${
                                formClient.methode_paiement === "CASH"
                                  ? "bg-gray-800 text-white border-gray-800"
                                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                              }`}
                            >
                              💵 Cash
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setFormClient({
                                ...formClient,
                                methode_paiement: "MVOLA",
                              })
                            }
                            className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase transition-all border ${
                              formClient.methode_paiement === "MVOLA"
                                ? "bg-[#00c853] text-white border-[#00c853]"
                                : "bg-white text-gray-500 border-gray-200 hover:border-[#00c853]"
                            }`}
                          >
                            🟢 MVola
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setFormClient({
                                ...formClient,
                                methode_paiement: "ORANGE",
                              })
                            }
                            className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase transition-all border ${
                              formClient.methode_paiement === "ORANGE"
                                ? "bg-[#ff6600] text-white border-[#ff6600]"
                                : "bg-white text-gray-500 border-gray-200 hover:border-[#ff6600]"
                            }`}
                          >
                            🟠 Orange
                          </button>
                        </div>
                      </div>
                     {/* VÉRIFICATION VISUELLE DU MINIMUM DE COMMANDE */}
                     {(() => {
                        const minRequis = formClient.type_livraison === "TANA" ? minCommandes.tana : minCommandes.province;
                        const isMinAtteint = totalPanier >= minRequis;

                        return (
                          <>
                            {minRequis > 0 && !isMinAtteint && (
                              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-[11px] font-black text-center mt-4 animate-pulse">
                                ⚠️ Minimum d'achat non atteint ({formatAr(totalPanier)} / {formatAr(minRequis)} Ar)
                              </div>
                            )}
                            <button
                              type="submit"
                              disabled={isSubmitting || (minRequis > 0 && !isMinAtteint)}
                              className={`w-full p-3.5 rounded-lg font-black uppercase text-sm shadow-md transition-colors mt-4 flex justify-center items-center gap-2 ${
                                minRequis > 0 && !isMinAtteint 
                                  ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                                  : "bg-[#800020] text-white hover:bg-gray-900"
                              }`}
                            >
                              {isSubmitting
                                ? "Traitement en cours..."
                                : "Valider la commande"}
                            </button>
                          </>
                        );
                      })()}
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* VUE : INFORMATIONS (Livraison, Conditions, Suivi) */}
        {/* ======================================================= */}
        {view === "livraison" && (
          <div className="max-w-3xl mx-auto px-4 mt-8 mb-16">
            <h2 className="text-2xl md:text-3xl font-black uppercase text-[#800020] mb-6">
              Informations de Livraison
            </h2>
            <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-sm border border-gray-100">
              {texteLivraison ? (
                renderFormattedText(texteLivraison)
              ) : (
                <p className="text-gray-500 italic text-center py-10">
                  À venir.
                </p>
              )}
            </div>
          </div>
        )}
        {view === "conditions" && (
          <div className="max-w-3xl mx-auto px-4 mt-8 mb-16">
            <h2 className="text-2xl md:text-3xl font-black uppercase text-[#800020] mb-6">
              Conditions Générales
            </h2>
            <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-sm border border-gray-100">
              {texteConditions ? (
                renderFormattedText(texteConditions)
              ) : (
                <p className="text-gray-500 italic text-center py-10">
                  À venir.
                </p>
              )}
            </div>
          </div>
        )}
        {view === "recherche_suivi" && (
          <div className="max-w-xl mx-auto px-4 mt-12 mb-16">
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border-t-8 border-[#800020]">
              <h2 className="text-2xl font-black uppercase text-gray-800 mb-2 text-center">
                Où est ma commande ? 🚚
              </h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSubmitting(true);
                  const { data } = await supabase
                    .from("commandes_web")
                    .select("*")
                    .eq(
                      "numero_commande",
                      formSuivi.numero.toUpperCase().trim()
                    )
                    .maybeSingle();
                  setIsSubmitting(false);
                  if (
                    data &&
                    data.client_whatsapp.trim() === formSuivi.whatsapp.trim()
                  ) {
                    setView(`suivi/${data.numero_commande}`);
                  } else {
                    alert("❌ Commande introuvable.");
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    Numéro WhatsApp *
                  </label>
                  <input
                    type="tel"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-bold mt-1 focus:border-green-500 transition"
                    value={formSuivi.whatsapp}
                    onChange={(e) =>
                      setFormSuivi({ ...formSuivi, whatsapp: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    Numéro de Suivi (CMD-...) *
                  </label>
                  <input
                    type="text"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-black uppercase mt-1 focus:border-[#800020] transition"
                    value={formSuivi.numero}
                    onChange={(e) =>
                      setFormSuivi({ ...formSuivi, numero: e.target.value })
                    }
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#800020] hover:bg-black text-white p-4 rounded-xl font-black uppercase shadow-lg transition mt-6"
                >
                  {isSubmitting ? "Recherche..." : "Rechercher 🔍"}
                </button>
              </form>
            </div>
          </div>
        )}
        {view.startsWith("suivi/") && (
          <div className="max-w-3xl mx-auto px-4 mt-8 mb-16">
            <button
              onClick={() => setView("accueil")}
              className="mb-6 font-bold text-gray-500 hover:text-[#800020] flex items-center gap-2 transition"
            >
              ← Retour à la boutique
            </button>
            <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-xl border-t-8 border-[#800020]">
              <h2 className="text-2xl font-black uppercase text-gray-800 mb-2">
                Suivi de Commande
              </h2>
              <p className="text-gray-500 font-bold mb-8">
                N° {view.replace("suivi/", "")}
              </p>
              {loadingSuivi ? (
                <div className="text-center py-10 font-bold text-gray-500 animate-pulse">
                  Recherche...
                </div>
              ) : !commandeSuivi ? (
                <div className="text-center py-10 bg-red-50 text-red-600 font-black rounded-xl">
                  ❌ Introuvable.
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="relative pt-4">
                    <div className="absolute top-1/2 left-0 w-full h-2 bg-gray-100 rounded-full -translate-y-1/2"></div>
                    <div
                      className={`absolute top-1/2 left-0 h-2 rounded-full -translate-y-1/2 transition-all duration-1000 ${
                        commandeSuivi.statut === "Annulée"
                          ? "bg-red-500 w-full"
                          : commandeSuivi.statut === "En attente"
                          ? "bg-gray-400 w-1/4"
                          : commandeSuivi.statut === "En cours de préparation"
                          ? "bg-yellow-400 w-2/4"
                          : commandeSuivi.statut === "En cours de livraison"
                          ? "bg-blue-500 w-3/4"
                          : "bg-green-500 w-full"
                      }`}
                    ></div>
                  </div>
                  <div className="text-center mt-4">
                    <span
                      className={`inline-block px-4 py-2 rounded-full font-black uppercase tracking-widest text-white shadow-md ${
                        commandeSuivi.statut === "Annulée"
                          ? "bg-red-500"
                          : commandeSuivi.statut === "En attente"
                          ? "bg-gray-500"
                          : commandeSuivi.statut === "En cours de préparation"
                          ? "bg-yellow-500"
                          : commandeSuivi.statut === "En cours de livraison"
                          ? "bg-blue-600 animate-pulse"
                          : "bg-green-500"
                      }`}
                    >
                      {commandeSuivi.statut}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                    <h3 className="font-black text-gray-700 uppercase mb-4 border-b border-gray-200 pb-2">
                      Récapitulatif
                    </h3>
                    <p className="text-sm mb-1 text-gray-700">
                      <span className="font-bold text-gray-500">Client :</span>{" "}
                      {commandeSuivi.client_nom}
                    </p>
                    <p className="text-sm mb-4 text-gray-700">
                      <span className="font-bold text-gray-500">Adresse :</span>{" "}
                      {commandeSuivi.quartier} - {commandeSuivi.adresse_detail}
                    </p>

                    {/* LISTE DES ARTICLES */}
                    {commandeSuivi.articles_json && commandeSuivi.articles_json.articles && commandeSuivi.articles_json.articles.length > 0 && (
                      <div className="mb-4 bg-white p-3 rounded-xl border border-gray-100">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">
                          Articles commandés
                        </h4>
                        <ul className="space-y-2">
                          {commandeSuivi.articles_json.articles.map((article, idx) => (
                            <li key={idx} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                              <span className="text-gray-800 font-semibold">
                                <span className="text-[#800020] font-black">{article.qte}x</span> {article.nom}
                              </span>
                              <span className="text-gray-600 font-bold text-xs">
                                {formatAr(article.prix_vente * article.qte)} Ar
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* TOTAL DETAILLÉ */}
                    <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                      <div className="flex justify-between items-center text-sm font-bold text-gray-600">
                        <span>Sous-total articles</span>
                        <span>{formatAr(commandeSuivi.montant_total)} Ar</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold text-gray-600">
                        <span>Frais de livraison</span>
                        <span>+ {formatAr(commandeSuivi.frais_livraison)} Ar</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-200">
                        <span className="font-black text-[#800020] uppercase text-sm">
                          Total Global
                        </span>
                        <span className="font-black text-[#800020] text-2xl">
                          {formatAr(
                            Number(commandeSuivi.montant_total) +
                            Number(commandeSuivi.frais_livraison)
                          )}{" "}
                          Ar
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* BOUTONS PDF */}
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={() => genererPDFDepuisSuivi("REÇU PROVISOIRE WEB")}
                      className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 p-3.5 rounded-xl font-bold text-sm transition shadow-sm flex items-center justify-center gap-2"
                    >
                      📄 Télécharger le reçu provisoire
                    </button>
                    {(commandeSuivi.statut === "Livrée" || commandeSuivi.statut === "Livré") && (
                      <button
                        onClick={() => genererPDFDepuisSuivi("FACTURE DÉFINITIVE")}
                        className="w-full bg-[#800020] hover:bg-black text-white p-3.5 rounded-xl font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 animate-in fade-in duration-500"
                      >
                        🧾 Télécharger la facture définitive
                      </button>
                    )}
                  </div>

                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* VUE : SUCCES */}
        {/* ======================================================= */}
       {/* ======================================================= */}
        {/* VUE : SUCCES (DESIGN PREMIUM) */}
        {/* ======================================================= */}
        {view === "succes" && commandeValidee && (
          <div className="max-w-3xl mx-auto px-4 mt-12 mb-20 animate-in zoom-in duration-500">
            <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100">
              
              {/* En-tête de succès */}
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-100">
                  <svg width="36" height="36" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="animate-[bounce_1s_ease-out]">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-3">
                  Commande Validée
                </h2>
                <p className="text-gray-500 font-medium md:text-lg">
                  Merci <span className="text-gray-900 font-black">{commandeValidee.nom}</span>, votre demande a été traitée avec succès.
                </p>
              </div>

              {/* Carte de commande */}
              <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-100 mb-10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="text-center md:text-left w-full md:w-auto">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">N° de Commande</p>
                    <p className="text-2xl font-black text-gray-900 tracking-widest bg-white px-5 py-3 rounded-xl shadow-sm border border-gray-200/60 select-all">
                      {commandeValidee.numero}
                    </p>
                  </div>
                  <div className="text-center md:text-right w-full md:w-auto">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Net</p>
                    <p className="text-3xl md:text-4xl font-black text-[#800020] tracking-tighter">
                      {formatAr(commandeValidee.total)} Ar
                    </p>
                  </div>
                </div>
              </div>

              {/* Message Dynamique (Physique vs Digital) */}
              {commandeValidee.articles.some(p => p.categorie_web === "Services" || p.sous_categorie_web === "Services") ? (
                <div className="mb-10 p-6 bg-purple-50 rounded-2xl border border-purple-100 flex gap-4 items-start">
                  <div className="text-2xl mt-1">💻</div>
                  <div>
                    <h3 className="font-black uppercase text-sm text-purple-900 mb-1 tracking-wider">Livraison Numérique</h3>
                    <p className="text-sm font-bold text-purple-700 leading-relaxed">Votre service sera activé et envoyé sur le canal choisi sous 24h ouvrées après confirmation du paiement.</p>
                  </div>
                </div>
              ) : (
                <div className="mb-10">
                  <h3 className="font-black uppercase text-[10px] text-gray-400 tracking-widest mb-6 text-center">Prochaines étapes</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-[#800020] text-white flex items-center justify-center font-black shrink-0">1</div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">Préparation</h4>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Notre équipe prépare vos articles avec soin.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm opacity-70">
                      <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 border border-gray-200 flex items-center justify-center font-black shrink-0">2</div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">Confirmation</h4>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Nous vous contacterons dans les plus brefs délais via WhatsApp.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Boutons d'action modernes */}
              <div className="flex flex-col gap-3">
                {/* INFO SUIVI AJOUTÉE */}
              <div className="mb-8 p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
                <div className="text-xl mt-0.5 animate-bounce">📍</div>
                <div>
                  <h3 className="font-black text-sm text-blue-900 mb-1 tracking-tight">Où est ma commande ?</h3>
                  <p className="text-xs font-medium text-blue-800 leading-relaxed">
                    Vous pouvez suivre l'avancée de votre livraison à tout moment. Il vous suffit de cliquer sur le lien de suivi ci-dessous et d'utiliser votre numéro de téléphone ainsi que votre code : <strong className="bg-white px-2 py-1 rounded shadow-sm border border-blue-200 select-all text-blue-900">{commandeValidee.numero}</strong>.
                  </p>
                </div>
              </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <button
                    onClick={() => setView(`suivi/${commandeValidee.numero}`)}
                    className="flex-1 bg-gray-900 hover:bg-black text-white px-6 py-4 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    Suivre la commande
                  </button>
                  <a
                    href={`https://wa.me/261348697298?text=${encodeURIComponent(`Bonjour Hakimi Plus ! Je viens de valider la commande ${commandeValidee.numero}.`)}`}
                    target="_blank" rel="noreferrer"
                    className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-4 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    Contacter le support
                  </a>
                </div>
                <button
                  onClick={telechargerRecuPDF}
                  className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-6 py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Télécharger le Reçu Provisoire
                </button>
              </div>

              <div className="text-center pt-8 mt-8 border-t border-gray-100">
                <button
                  onClick={() => {
                    setView("accueil");
                    setCommandeValidee(null);
                    sessionStorage.removeItem("hakimi_commande_validee");
                  }}
                  className="text-xs font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors"
                >
                  ← Revenir à la boutique
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- 🚀 NOTIFICATION MODERNE (TOAST) --- */}
      {notificationPanier && (
        <div className="fixed top-20 md:top-24 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-8 fade-in duration-300">
          <div className="bg-white/90 backdrop-blur-md pl-1.5 pr-4 py-1.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 flex items-center gap-3 w-max max-w-[90vw]">
            <div className="bg-[#800020] text-white w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm">
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            <p className="text-xs font-medium text-gray-600 truncate max-w-[140px] md:max-w-[250px]">
              <strong className="text-gray-900 font-black">
                {notificationPanier}
              </strong>{" "}
              ajouté
            </p>
            <div className="w-px h-4 bg-gray-200 mx-1 shrink-0"></div>
            <button
              onClick={() => {
                setNotificationPanier(null);
                setView("panier");
              }}
              className="text-[10px] font-black text-[#800020] hover:text-black uppercase tracking-widest transition-colors shrink-0 flex items-center gap-1"
            >
              Panier
              <svg
                width="12"
                height="12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      )}
      {/* --- FOOTER --- */}
      <footer className="bg-gray-900 text-white py-12 border-t border-transparent transition-colors duration-500">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-black italic text-xl mb-4 tracking-tighter">
              HAKIMI PLUS
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Votre boutique en ligne. Retrouvez vos produits préférés avec
              un service de livraison rapide et un paiement sécurisé à la
              réception.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-300 uppercase tracking-widest mb-4">
              Liens Rapides
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <button
                  onClick={() => setView("catalogue")}
                  className="hover:text-white transition"
                >
                  🛍️ Notre Catalogue
                </button>
              </li>
              <li>
                <button
                  onClick={() => setView("livraison")}
                  className="hover:text-white transition"
                >
                  🚚 Infos Livraison
                </button>
              </li>
              <li>
                <button
                  onClick={() => setView("conditions")}
                  className="hover:text-white transition"
                >
                  📜 Conditions Générales
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-300 uppercase tracking-widest mb-4">
              Nos coordonnées
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                📍 Anosizato Atsinanana, Tananarive, Madagascar
              </li>
              <li className="flex items-center gap-2">
                📞 034 86 972 98 / 032 15 266 01
              </li>
              <li>
                <a
                  href="https://wa.me/261348697298"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-2 bg-green-500 hover:bg-green-600 text-white text-xs font-black uppercase px-4 py-2 rounded-lg transition shadow-md"
                >
                  💬 Contactez-nous via WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 text-center text-xs text-gray-500 font-bold">
          &copy; {new Date().getFullYear()} Version 1.0-Hakimi Plus. Tous droits
          réservés.
        </div>
      </footer>
      {/* --- 🍎 INSTRUCTIONS D'INSTALLATION POUR IPHONE --- */}
      {showIOSPrompt && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center px-4 pb-12 sm:pb-0">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in"
            onClick={() => setShowIOSPrompt(false)}
          ></div>
          <div className="relative bg-white/90 backdrop-blur-xl w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 border border-white">
            <button 
              onClick={() => setShowIOSPrompt(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold"
            >
              ×
            </button>
            <div className="text-center mb-6">
              <img src={LOGO_URL} alt="Logo" className="w-16 h-16 object-contain mx-auto mb-3 drop-shadow-md rounded-xl" />
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Installer Hakimi Plus</h3>
              <p className="text-sm text-gray-500 font-medium mt-1">Installez l'application sur votre iPhone pour un accès rapide.</p>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500 text-xl border border-gray-100 shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                    <polyline points="16 6 12 2 8 6"></polyline>
                    <line x1="12" y1="2" x2="12" y2="15"></line>
                  </svg>
                </div>
                <p className="text-sm text-gray-700 font-bold">1. Appuyez sur le bouton <span className="text-blue-500">Partager</span> en bas de l'écran.</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-800 text-xl border border-gray-100 shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                </div>
                <p className="text-sm text-gray-700 font-bold">2. Choisissez <span className="text-gray-900">Sur l'écran d'accueil</span>.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showWhatsApp && (
        <div className="fixed bottom-6 right-6 z-[150] flex flex-col items-end gap-2">
          <button
            onClick={() => setShowWhatsApp(false)}
            className="bg-white text-gray-400 hover:text-red-500 rounded-full w-6 h-6 flex items-center justify-center shadow-md border border-gray-100 text-xs font-black transition"
            title="Masquer le bouton"
          >
            ×
          </button>
          <a
            href="https://wa.me/261348697298?text=Bonjour Hakimi Plus, j'ai une question !"
            target="_blank"
            rel="noreferrer"
            className="w-16 h-16 bg-green-500 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl hover:scale-110 active:scale-95 transition-all duration-300 animate-bounce"
            title="Discuter sur WhatsApp"
          >
            <svg width="35" height="35" fill="currentColor" viewBox="0 0 16 16">
              <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
