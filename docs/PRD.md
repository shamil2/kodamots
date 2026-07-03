Version 2.1 — Application Multijoueur Bilingue Mobile-Only
1. Informations Générales & Métadonnées
Attribut	Spécification
Nom du Projet	
Speed Bac Mobile  
MD

Statut du Document	
Validé pour Développement

  
MD

Date de Création	
Juillet 2026  
MD

Auteur	
Équipe Produit / Shamil  
MD

Plateformes Cibles	
Mobile uniquement (PWA / Web App iOS & Android)  
MD

Langues Supportées	
Français (FR), Anglais (EN)  
MD

2. Vision du Produit & Objectifs Stratégiques
2.1 Vision
Speed Bac Mobile est une réinvention moderne, frénétique et bilingue du jeu traditionnel du "Petit Bac". Exclusivement conçu pour les écrans de smartphones, le produit vise à éliminer toutes les frictions d'accès (pas d'installation obligatoire, pas d'inscription requise) pour proposer des sessions de jeu multijoueurs en temps réel ultra-rapides, jouables à une main. Le jeu réunit des joueurs autour de défis de rapidité lexicale où la vivacité d'esprit et la vitesse de saisie tactile font la différence.  
MD
+ 2

2.2 Objectifs Clés (KPIs)
Friction Zéro : Temps moyen entre l'arrivée sur l'application et le début d'une partie inférieur à 30 secondes.  
MD

Viralité (K-Factor) : Chaque salon créé doit générer en moyenne 2,5 nouveaux utilisateurs via le partage de liens natifs.  
MD

Rétention Mobile : Atteindre un taux de réengagement de 35% sur les sessions hebdomadaires grâce à un gameplay addictif et des parties courtes (3 à 5 minutes).  
MD

Performance Temps Réel : Latence de synchronisation des états de jeu inférieure à 100ms via WebSockets.  
MD

3. Périmètre du Produit (Product Scope) & Fonctionnalités
3.1 Contraintes Strictes "Mobile-Only"
L'application est pensée, designée et développée exclusivement pour les smartphones en orientation Portrait.  
MD

Blocage Desktop : Tout accès depuis un agent utilisateur (User Agent) Desktop doit afficher une page d'atterrissage épurée invitant l'utilisateur à scanner un QR Code pour jouer sur son téléphone.  
MD

Gestion du Viewport : L'interface doit dynamiquement s'ajuster en utilisant les unités CSS modernes (ex: svh) pour éviter tout décalage visuel ou masquage d'éléments lors de l'ouverture du clavier virtuel iOS/Android.  
MD

3.2 Gestion du Bilinguisme et Localisation
Le bilinguisme intervient à deux niveaux distincts dans l'application :  
MD

Langue de l'Interface (UI) : Choix global dès l'ouverture de l'application (Français ou Anglais). Ce paramètre modifie les libellés des menus, boutons, notifications et messages d'erreur.  
MD
+ 1

Langue du Salon (Gameplay Language) : Défini par l'hôte lors de la création de la partie.  
MD

Mode Français : Seuls les mots du dictionnaire français sont éligibles.  
MD

Mode Anglais : Seuls les mots du dictionnaire anglais sont éligibles.  
MD

Mode Mixte : Les mots des deux dictionnaires sont acceptés (idéal pour les groupes internationaux).  
MD

3.3 Cycle et Mécaniques de Jeu (Game Loop)
Chaque partie est découpée en manches successives (paramétrables de 1 à 10). Une manche suit le cycle de vie automatisé suivant :  
MD
+ 1

💡 La Boucle de Jeu en Temps Réel
Lancement : Une roulette visuelle détermine une lettre de l'alphabet commune à tous les joueurs (en excluant les lettres complexes si option activée : W, X, Y, Z).  
MD

Phase de Saisie : Les joueurs remplissent les champs textuels correspondant aux catégories affichées à l'écran.  
MD

Le Bouton "SPEED" : Dès qu'un joueur remplit l'intégralité de ses champs, un gros bouton central "SPEED" s'active. S'il clique dessus, un compte à rebours global et impitoyable de 5 secondes est déclenché pour tous les autres participants, figeant ensuite définitivement toutes les saisies.  
MD
+ 1

3.4 Système de Vote Tactile Interactif (Swipe)
Pour pallier les limites des correcteurs orthographiques automatiques, une phase de validation communautaire s'ouvre à la fin de chaque manche.  
MD

L'interface affiche les réponses soumises, catégorie par catégorie.  
MD

Les joueurs effectuent un geste de Swipe à droite pour valider un mot (Vert) ou un Swipe à gauche pour le rejeter (Rouge).  
MD

La décision finale est automatisée à la majorité absolue des votants. En cas d'égalité parfaite, le mot est considéré comme valide.  
MD
+ 1

3.5 Règles de Calcul des Scores
À la fin des votes d'une manche, le serveur calcule instantanément les scores selon la matrice suivante :  
MD

Statut de la Réponse	Points Attribués	Description / Condition
Mot Valide et Unique	10 pts	
Le mot a été validé par la communauté et aucun autre joueur ne l'a proposé dans cette catégorie.  
MD

Mot Valide mais Partagé	5 pts	
Le mot est valide, mais un ou plusieurs autres joueurs ont écrit exactement le même mot.  
MD

Mot Invalide ou Vide	0 pt	
Le mot a été rejeté par le vote ou le champ a été laissé vide à la fin du chrono.  
MD

Bonus "SPEED"	+2 pts	
Accordé au joueur ayant déclenché la fin de manche, à la condition stricte que 100% de ses propres réponses soient validées.  
MD

4. Parcours Utilisateur (User Flows)
Afin de garantir l'absence de friction, le parcours utilisateur est direct et linéaire.  
MD

4.1 Flux de l'Hôte (Création de Partie)
L'utilisateur arrive sur speedbac.app depuis son mobile.  
MD

Sélection de la langue de l'UI via un toggle discret (FR/EN).  
MD

Clic sur le bouton principal "Créer un Salon Privé".  
MD

Saisie de son pseudonyme de joueur.  
MD

Configuration des options de jeu : Langue de la partie, sélection des catégories (via des switchs tactiles), nombre de manches, activation/désactivation des lettres rares.  
MD

Clic sur "Générer le lien d'invitation". L'application sollicite l'API native de partage du smartphone (permettant d'envoyer directement le lien préformaté sur WhatsApp, SMS, Discord, etc.).  
MD
+ 1

Attente dans le Lobby. Clic sur "Lancer la Partie" dès que les joueurs ont rejoint.  
MD
+ 1

4.2 Flux de l'Invité (Rejoindre une Partie)
L'invité clique sur le lien reçu (ex: speedbac.app/room/XYZ42).  
MD

Le navigateur mobile ouvre l'application directement au sein du bon salon.  
MD

L'utilisateur saisit simplement son pseudonyme et clique sur "Rejoindre".  
MD

Il est immédiatement visible dans la liste des joueurs du Lobby en temps réel.  
MD

5. Spécifications Techniques & Architecture
5.1 Stack Technique Recommandée
Frontend : React / Next.js configuré en Progressive Web App (PWA) pour permettre une mise en cache agressive et une icône sur l'écran d'accueil. Tailwind CSS pour le stylisage utilitaire ultra-léger.  
MD
+ 1

Backend : Node.js (Fastify ou NestJS) ou Python (FastAPI), optimisé pour gérer les connexions asynchrones et persistantes.  
MD

Communication Temps Réel : WebSockets via Socket.io pour assurer une communication bidirectionnelle permanente entre les clients et le serveur.  
MD

Stockage En Mémoire (Cache) : Redis pour la persistance volatile des états de chaque salon (LobbyState, GameState, VoteState) assurant des temps de réponse sous la milliseconde.  
MD

5.2 Optimisation du Clavier Mobile
C'est le point technique le plus critique du projet. Pour éviter que le clavier virtuel ne vienne casser l'expérience utilisateur, les développeurs devront respecter les règles CSS et HTML suivantes :  
MD
+ 1

CSS
/* Utilisation impérative du Small Viewport Height pour le conteneur principal */
.app-container {
    height: 100svh;
    overflow: hidden;
    display: table; /* Alternative robuste pour éviter flex/grid au niveau global */
    width: 100%;
}
L'interface de jeu doit utiliser un défilement horizontal de type "Carousel" ou vertical très fluide afin que le champ actif soit toujours positionné dans la "Thumb Zone" (moitié inférieure de l'écran, juste au-dessus du clavier).  
MD

Désactivation des fonctions d'auto-correction et de capitalisation native sur les champs de saisie pour éviter les altérations de mots intempestives : autocorrect="off" autocapitalize="none" spellcheck="false".  
MD

5.3 Base de Données Lexicale (Dictionnaires)
Pour assister le vote et permettre (en phase 2) une pré-validation automatique, le backend intégrera deux dictionnaires légers indexés en mémoire (structures de type trie ou sets Redis) :  
MD

Dictionnaire FR : Basé sur l'ODS (Officiel du Scrabble) ou le projet Lexique open-source.  
MD

Dictionnaire EN : Basé sur l'index WordNet ou une liste de mots Scrabble usuelle (Collins/TWL).  
MD

6. Directives UI/UX & Ergonomie Tactile
Orientation unique : Blocage logiciel en mode Portrait. Si le téléphone est tourné, une alerte invite à repasser en mode vertical.  
MD
+ 1

Thumb Zone Optimization : Le bouton "SPEED", les boutons de swipe de vote, et les boutons de navigation inter-catégories doivent être dimensionnés pour une hauteur minimale de 48px afin de garantir un ciblage tactile sans erreur.  
MD

Identité Visuelle : Ambiance "Arcade Pop". Palette colorimétrique contrastée utilisant un fond sombre ou blanc pur très propre, rehaussé par un bleu technologique (#2B6CB0) pour les structures et des touches de couleurs vives pour les actions (Vert Émeraude pour la validation, Rouge Corail pour le rejet, Jaune Néon pour le mode SPEED).  
MD
+ 1

7. Plan de Déploiement & Feuille de Route (MVP)
Pour valider rapidement le concept auprès des utilisateurs, le développement est découpé en 4 sprints de 1 semaine chacun pour aboutir à un Produit Minimum Viable (MVP).  
MD

Sprint 1 : Architecture Réseau & Salons (Temps Réel Fondations)
Mise en place du serveur d'orchestration (Node.js/FastAPI + WebSockets).  
MD

Logique de création de salon avec identifiant unique court (4 caractères) et gestion des connexions/déconnexions de sockets.  
MD

Interface basique de Lobby avec synchronisation de la liste des joueurs en temps réel.  
MD

Sprint 2 : Moteur de Jeu Séquentiel (Gameplay Core)
Développement de la logique de sélection de la lettre et de distribution des catégories.  
MD

Intégration du formulaire de saisie mobile avec désactivation des corrections natives.  
MD

Implémentation du mécanisme du bouton "SPEED" et de son compte à rebours de 5 secondes synchronisé par le serveur.  
MD

Sprint 3 : Module de Vote par Swipe & Calcul des Scores
Création de la vue de vote au format "cartes à swiper" optimisée pour le pouce.  
MD

Algorithme de calcul automatique des points (gestion des doublons et application du bonus SPEED).  
MD

Écran de restitution finale des scores de la manche et classement général cumulé.  
MD

Sprint 4 : Localisation Bilingue, Polissage UI & Déploiement
Intégration du système d'internationalisation (i18n) pour l'UI (FR/EN) et branchement des deux dictionnaires pour le contrôle de la langue du salon.  
MD

Ajout des animations (roulette de lettre, transitions de manches, confettis de victoire).  
MD

Tests de montée en charge (Stress Tests WebSockets) et déploiement de la PWA sur Vercel/AWS.  
MD

8. Gestion des Risques & Atténuations
  
MD
+ 4
Risque Identifié	Sévérité	Stratégie d'Atténuation (Mitigation)
Déconnexion réseau en pleine manche (tunnel, baisse de réseau mobile)	
Élevée

  
MD

Le serveur conserve l'état du joueur pendant 30 secondes. S'il se reconnecte avec le même identifiant de session stocké dans le localStorage, il réintègre immédiatement sa manche en cours.  
MD
+ 1

Comportements toxiques ou triche systématique lors des votes communautaires	
Moyenne

  
MD

Mise en place d'un système de notation transparent. Les votes de chaque joueur sont visibles à l'écran par tous pour éviter les comportements malveillants répétés (voter systématiquement rouge contre un adversaire).  
MD
+ 1

Conflits d'affichage liés aux dimensions variées des claviers mobiles	
Élevée

  
MD

Utilisation exclusive de l'API JavaScript window.visualViewport pour recalculer dynamiquement la zone utile disponible et déplacer les boutons d'action au-dessus de la ligne de flottaison du clavier.  
MD