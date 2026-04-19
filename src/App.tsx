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

  useEffect(() => {
    if (view.startsWith("produit/") && produits.length > 0) {
      const prodId = view.split("produit/")[1];
      const prod = produits.find((p) => p.id.toString() === prodId);
      if (prod) setProduitSelectionne(prod);
      else setView("catalogue");
    }
  }, [view, produits]);

  const [menusWeb, setMenusWeb] = useState([]);
  const [menuActuel, setMenuActuel] = useState("");
  const [sousCatActuelle, setSousCatActuelle] = useState("TOUS LES PRODUITS");

  useEffect(() => {
    if (view.startsWith("catalogue")) {
      const parts = view.split("/");
      const catUrl = parts[1] ? decodeURIComponent(parts[1]).trim() : "";
      const sousCatUrl = parts[2]
        ? decodeURIComponent(parts[2]).trim()
        : "TOUS LES PRODUITS";
      setMenuActuel(catUrl);
      setSousCatActuelle(sousCatUrl);
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

  const [searchQuery, setSearchQuery] = useState("");
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

  const [formClient, setFormClient] = useState({
    nom: "",
    whatsapp: "",
    whatsapp2: "",
    type_livraison: "TANA",
    ville: "",
    quartier: "",
    adresse_detail: "",
    message_expedition: "",
    methode_paiement: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commandeValidee, setCommandeValidee] = useState(null);
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
          if (data.texte_livraison) setTexteLivraison(data.texte_livraison);
          if (data.texte_conditions) setTexteConditions(data.texte_conditions);
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
    const numeroEpuré = formClient.whatsapp.replace(/[^0-9]/g, "");
    if (numeroEpuré.length !== 10) return alert("⚠️ Numéro WhatsApp invalide.");

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
    setPanier([]);
    setFormClient({
      nom: "",
      whatsapp: "",
      whatsapp2: "",
      type_livraison: "TANA",
      ville: "",
      message_expedition: "",
      quartier: "",
      adresse_detail: "",
      methode_paiement: "",
    });
    setView("succes");
    setIsSubmitting(false);
  };

  let produitsFiltres = produits.filter((p) => {
    const matchMenu = menuActuel === "" || p.categorie_web === menuActuel;
    const matchSousCat =
      sousCatActuelle === "TOUS LES PRODUITS" ||
      p.sous_categorie_web === sousCatActuelle;
    const sq = searchQuery.toLowerCase().trim();
    const matchSearch =
      sq === "" ||
      (p.nom || "").toLowerCase().includes(sq) ||
      (p.description || "").toLowerCase().includes(sq) ||
      (p.categorie_web || "").toLowerCase().includes(sq) ||
      (p.sous_categorie_web || "").toLowerCase().includes(sq);
    const matchPrice =
      maxPrice === "" || Number(p.prix_vente) <= Number(maxPrice);
    return matchMenu && matchSousCat && matchSearch && matchPrice;
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
  // 🟢 LE REÇU PDF SÉCURISÉ (SCÉNARIO 5)
  // ======================================================================
  const telechargerRecuPDF = () => {
    if (!commandeValidee) return;

    const articlesHTML = commandeValidee.articles
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-size: 12px;">
          <strong style="color: #333;">${item.qte}x ${item.nom}</strong>
          ${
            item.sur_commande
              ? `<br/><span style="display: inline-block; margin-top: 4px; background-color: #ffedd5; color: #c2410c; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 900; text-transform: uppercase;">📦 Pre-commande</span>`
              : ""
          }
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; font-size: 12px; font-weight: bold;">
          ${formatAr(item.prix_vente * item.qte)} Ar
        </td>
      </tr>
    `
      )
      .join("");

    const isCmdSurCommande =
      commandeValidee.articles.length > 0 &&
      commandeValidee.articles[0].sur_commande === true;
    const totalArticles = commandeValidee.articles.reduce(
      (acc, i) => acc + Number(i.prix_vente) * i.qte,
      0
    );
    const fraisLiv = Number(commandeValidee.fraisLivraison || 0);
    const acompte = isCmdSurCommande ? Math.round(totalArticles * 0.6) : 0;
    const reste = isCmdSurCommande ? totalArticles - acompte + fraisLiv : 0;

    const element = document.createElement("div");
    element.innerHTML = `
      <div style="padding: 40px; font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: auto;">
        <div style="text-align: center; border-bottom: 2px solid #800020; padding-bottom: 15px; margin-bottom: 25px;">
          <h1 style="color:#800020; margin:0; font-size:28px; font-style:italic; font-weight:900;">HAKIMI PLUS</h1>
          <p style="margin:5px 0 0 0; color:#666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Note de Commande</p>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <p style="margin: 0; font-size: 10px; color: #888; font-weight: bold; text-transform: uppercase;">Client</p>
            <p style="margin: 5px 0; font-size: 14px; font-weight: bold;">${
              commandeValidee.nom
            }</p>
            <p style="margin: 0; font-size: 12px; color: #555;">Paiement: ${
              commandeValidee.methode
            }</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 10px; color: #888; font-weight: bold; text-transform: uppercase;">Date</p>
            <p style="margin: 5px 0; font-size: 13px;">${new Date().toLocaleString(
              "fr-FR"
            )}</p>
          </div>
        </div>

        <div style="background: #800020; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
          <p style="margin: 0; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Numero de Suivi Unique</p>
          <h2 style="margin: 5px 0 0 0; font-size: 32px; font-weight: 900;">${
            commandeValidee.numero
          }</h2>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px;">Recapitulatif des articles</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${articlesHTML}
          </table>
          
          <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #333;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="font-size: 14px; font-weight: bold; text-transform: uppercase;">Total de la commande :</span>
              <span style="font-size: 20px; font-weight: 900; color: #800020;">${formatAr(
                commandeValidee.total
              )} Ar</span>
            </div>
            
            ${
              isCmdSurCommande
                ? `
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #374151; font-weight: bold; text-transform: uppercase; text-align: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Echeancier de paiement (Pre-commande)</p>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; background-color: #fff7ed; padding: 5px 8px; border-radius: 4px;">
                  <span style="font-size: 13px; font-weight: 900; color: #c2410c;">1. Acompte de reservation (60%) :</span>
                  <span style="font-size: 14px; font-weight: 900; color: #c2410c;">${formatAr(
                    acompte
                  )} Ar</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 8px;">
                  <span style="font-size: 12px; font-weight: bold; color: #333;">2. A payer a la reception (40% + Liv.) :</span>
                  <span style="font-size: 13px; font-weight: bold; color: #333;">${formatAr(
                    reste
                  )} Ar</span>
                </div>
              </div>
            `
                : ""
            }
          </div>
        </div>

        <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; border-left: 5px solid #800020;">
          <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #800020;">🛰️ Comment suivre votre colis ?</h4>
          <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #555;">
            Vous pouvez suivre l'etat de votre livraison a tout moment sur notre site :<br/>
            <strong style="color: #333;">Lien :</strong> ${
              window.location.origin
            }/#/recherche_suivi<br/>
            Il vous suffira de saisir votre <strong>Numero WhatsApp</strong> et votre <strong>Numero de Suivi</strong> (${
              commandeValidee.numero
            }).
          </p>
        </div>
      </div>
    `;

    const options = {
      margin: 0,
      filename: `Recu_HakimiPlus_${commandeValidee.numero}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(options).from(element).save();
  };

  if (isCheckingMaintenance) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#800020] border-t-transparent rounded-full animate-spin"></div>
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
        <div className="text-center py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 bg-gray-100 text-gray-500">
          LIVRAISON TANA & PROVINCE
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
            <div
              className="cursor-pointer bg-white rounded-lg px-1"
              onClick={() => setView("accueil")}
            >
              <img
                src={LOGO_URL}
                alt="Logo"
                className="h-10 md:h-16 lg:h-20 object-contain"
              />
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

            <button
              onClick={() => setView("panier")}
              className="relative p-2 transition-colors text-gray-800 hover:text-[#800020]"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              {panier.length > 0 && (
                <span className="absolute top-0 right-0 text-white text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full bg-[#800020]">
                  {panier.length}
                </span>
              )}
            </button>
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
        {view.startsWith("catalogue") && (
          <div className="max-w-7xl mx-auto px-4 mt-4 mb-12 animate-in fade-in duration-500">
            {/* TITRE ÉPURÉ */}
            <div className="flex items-center gap-3 mb-6">
              <span className="w-1.5 h-6 bg-gray-900 rounded-full inline-block shrink-0"></span>
              <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                {menuActuel || "Notre Catalogue"}
              </h2>
            </div>

            {/* CATÉGORIES PRINCIPALES (Scroll horizontal) */}
            <div
              className="flex overflow-x-auto gap-3 mb-4 pb-2 no-scrollbar"
              style={{ scrollSnapType: "x mandatory" }}
            >
              <button
                onClick={() => setView("catalogue")}
                className={`whitespace-nowrap shrink-0 snap-start px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                  menuActuel === ""
                    ? "bg-gray-900 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Tous
              </button>
              {menusWeb.map((menu, idx) => {
                const nomMenu = menu.PARENT || menu.parent;
                return (
                  <button
                    key={idx}
                    onClick={() => setView("catalogue/" + nomMenu)}
                    className={`whitespace-nowrap shrink-0 snap-start px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                      menuActuel === nomMenu
                        ? "bg-gray-900 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                  onClick={() => setView(`catalogue/${menuActuel}`)}
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
                            setView(`catalogue/${menuActuel}/${sc}`)
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
                            className="max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
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
                          placeholder="Ex: Jean Dupont"
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
                          <button
                            type="button"
                            onClick={() => handleShippingChange("TANA")}
                            className={`flex-1 py-1.5 rounded-md font-black text-[11px] uppercase transition-all ${
                              formClient.type_livraison === "TANA"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-400 hover:text-gray-600"
                            }`}
                          >
                            📍 Tana
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShippingChange("PROVINCE")}
                            className={`flex-1 py-1.5 rounded-md font-black text-[11px] uppercase transition-all ${
                              formClient.type_livraison === "PROVINCE"
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-gray-400 hover:text-gray-600"
                            }`}
                          >
                            🚚 Province
                          </button>
                        </div>
                      </div>
                      {formClient.type_livraison === "TANA" ? (
                        <div className="space-y-3">
                          <div>
                            <input
                              list="quartiers-list"
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-bold outline-none focus:border-[#800020] transition-colors"
                              placeholder="🔍 Taper ou choisir un quartier..."
                              required
                              value={formClient.quartier}
                              onChange={(e) =>
                                setFormClient({
                                  ...formClient,
                                  quartier: e.target.value,
                                })
                              }
                            />
                            <datalist id="quartiers-list">
                              {quartiersDb.map((q) => (
                                <option key={q.nom} value={q.nom}>
                                  {q.nom} (+{formatAr(q.frais)} Ar)
                                </option>
                              ))}
                            </datalist>
                          </div>
                          <textarea
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-medium text-sm text-gray-800 outline-none h-14 resize-none focus:border-[#800020] transition-colors"
                            placeholder="Précisions: Lot, portail, bâtiment..."
                            value={formClient.adresse_detail}
                            onChange={(e) =>
                              setFormClient({
                                ...formClient,
                                adresse_detail: e.target.value,
                              })
                            }
                            required
                            disabled={isSubmitting}
                          />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <input
                            className="w-full p-2.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg font-bold text-sm outline-none placeholder-blue-300 focus:border-blue-500 transition-colors"
                            placeholder="Ville de destination *"
                            value={formClient.ville}
                            onChange={(e) =>
                              setFormClient({
                                ...formClient,
                                ville: e.target.value,
                              })
                            }
                            required
                            disabled={isSubmitting}
                          />
                          <textarea
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-medium text-sm text-gray-800 outline-none h-14 resize-none focus:border-blue-500 transition-colors"
                            placeholder="Transporteur préféré, agence..."
                            value={formClient.message_expedition}
                            onChange={(e) =>
                              setFormClient({
                                ...formClient,
                                message_expedition: e.target.value,
                              })
                            }
                            disabled={isSubmitting}
                          />
                        </div>
                      )}
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
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#800020] text-white p-3.5 rounded-lg font-black uppercase text-sm shadow-md hover:bg-gray-900 transition-colors mt-4 flex justify-center items-center gap-2"
                      >
                        {isSubmitting
                          ? "Traitement en cours..."
                          : "Valider la commande"}
                      </button>
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
                    <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                      <span className="font-black text-[#800020] uppercase text-sm">
                        Total à payer
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
              )}
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* VUE : SUCCES */}
        {/* ======================================================= */}
        {view === "succes" && commandeValidee && (
          <div className="max-w-2xl mx-auto px-4 mt-12 mb-16 animate-in zoom-in-95 duration-300">
            <div className="bg-white p-8 md:p-10 rounded-2xl shadow-lg border border-gray-100">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    width="32"
                    height="32"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                </div>
                <h2 className="text-3xl font-black text-gray-800 tracking-tight mb-2">
                  Commande Confirmée
                </h2>
                <p className="text-gray-500 font-medium">
                  Merci pour votre confiance,{" "}
                  <span className="text-gray-800 font-bold">
                    {commandeValidee.nom}
                  </span>
                  .
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-8">
                <div className="text-center mb-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Votre Numéro de Suivi Unique
                  </p>
                  <p className="text-3xl font-black text-[#800020] tracking-widest bg-white inline-block px-4 py-2 rounded-lg border border-gray-200 shadow-sm select-all">
                    {commandeValidee.numero}
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-2">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-black text-gray-900 uppercase tracking-widest">
                      Total de la commande
                    </span>
                    <span className="text-2xl font-black text-[#800020] tracking-tighter">
                      {formatAr(commandeValidee.total)} Ar
                    </span>
                  </div>

                  {commandeValidee.articles.length > 0 &&
                    commandeValidee.articles[0].sur_commande &&
                    (() => {
                      const totalArt = commandeValidee.articles.reduce(
                        (acc, i) => acc + Number(i.prix_vente) * i.qte,
                        0
                      );
                      const ac = Math.round(totalArt * 0.6);
                      const rest = commandeValidee.total - ac;
                      return (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-3 text-center">
                            Paiement en 2 fois (Pré-commande)
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-center">
                              <p className="text-[10px] font-black text-orange-800 uppercase tracking-widest mb-1">
                                1. Acompte (60%)
                              </p>
                              <p className="text-xl font-black text-[#800020]">
                                {formatAr(ac)} Ar
                              </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                              <p className="text-[10px] font-black text-gray-800 uppercase tracking-widest mb-1">
                                2. À l'arrivée (40% + Liv.)
                              </p>
                              <p className="text-xl font-bold text-gray-800">
                                {formatAr(rest)} Ar
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                </div>
              </div>

              <div className="mb-8 p-6 bg-red-50/50 rounded-xl border border-red-100">
                <h3 className="font-black uppercase text-xs text-[#800020] mb-4 tracking-widest flex items-center gap-2">
                  🚀 Que se passe-t-il maintenant ?
                </h3>
                <ul className="text-sm text-gray-700 space-y-4 font-medium">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-[#800020] text-white rounded-full flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <span>
                      Notre équipe enregistre votre commande{" "}
                      {commandeValidee.articles.length > 0 &&
                      commandeValidee.articles[0].sur_commande
                        ? "d'importation"
                        : "en stock"}
                      .
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-[#800020] text-white rounded-full flex items-center justify-center text-[10px]">
                      2
                    </span>
                    <span>
                      Vous recevrez un appel ou un message WhatsApp pour{" "}
                      {commandeValidee.articles.length > 0 &&
                      commandeValidee.articles[0].sur_commande
                        ? "régler l'acompte."
                        : "confirmer la livraison."}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setView(`suivi/${commandeValidee.numero}`)}
                  className="w-full bg-[#800020] hover:bg-[#5a0016] text-white p-3.5 rounded-xl font-bold text-sm transition shadow-sm"
                >
                  📍 Suivre ma commande
                </button>
                <a
                  href={`https://wa.me/261348697298?text=${encodeURIComponent(
                    `Bonjour Hakimi Plus ! Je suis ${
                      commandeValidee.nom
                    }, je viens de valider la commande ${
                      commandeValidee.numero
                    } d'un montant de ${formatAr(commandeValidee.total)} Ar.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white p-3.5 rounded-xl font-bold text-sm transition shadow-sm flex justify-center items-center gap-2"
                >
                  WhatsApp
                </a>
                <button
                  onClick={telechargerRecuPDF}
                  className="md:col-span-2 w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 p-3.5 rounded-xl font-bold text-sm transition shadow-sm"
                >
                  📄 Télécharger le reçu PDF
                </button>
              </div>

              <div className="text-center pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setView("accueil");
                    setCommandeValidee(null);
                  }}
                  className="text-xs font-bold text-gray-500 hover:text-[#800020] uppercase tracking-widest transition"
                >
                  ← Retourner à la boutique
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
              Votre boutique de confiance. Retrouvez vos produits préférés avec
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
                📍 Anosizato, Tananarive, Madagascar
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
