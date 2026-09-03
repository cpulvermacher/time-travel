Fonctionnalités :
- Simule la date et l'heure pour toutes les méthodes des objets Date et Intl.DateTimeFormat, ainsi que pour Temporal.Now lorsque le navigateur le prend en charge.
- Le fuseau horaire peut être modifié, avec une prise en charge complète des passages à l'heure d'été.
- L'horloge peut être arrêtée et relancée.
- Option pour recharger automatiquement la page après un changement de date.
- N'affecte que l'onglet actuel, après un clic sur l'icône de l'extension.

Limitations :
- Seul JavaScript est affecté par l'extension.
- Certaines fonctionnalités ou animations peuvent se comporter étrangement si l'horloge est arrêtée.
- L'extension ne fonctionne pas dans les iframes ayant l'attribut sandbox.

Utilisation :
- Ouvrez l'onglet dans lequel vous souhaitez changer l'heure.
- Cliquez sur l'icône Extensions dans la barre d'outils, puis sur Time Travel.
- Choisissez une date dans le calendrier et modifiez l'heure si nécessaire, ou saisissez directement une date et une heure (voir les exemples ci-dessous).
- Validez avec Entrée ou en cliquant sur le bouton d'application, qui affiche un aperçu de la modification à appliquer (par ex. "Changer la date à 27 avr. 2025 12:40").
- Tout objet JavaScript Date, Intl.DateTimeFormat ou Temporal.Now de l'onglet actuel renvoie désormais la date et l'heure factices que vous avez définies. Les autres onglets et origines ne sont pas affectés.

Pour rétablir l'heure du système, cliquez sur l'icône de l'extension et désactivez l'interrupteur "Date JavaScript factice", ou videz le champ de saisie et appuyez sur Entrée.

Lorsque la date factice est activée, l'horloge avance à partir de l'heure configurée. L'heure actuelle de la page est indiquée sous "La page voit :", qui affiche également l'heure réelle lorsque l'extension est désactivée.
Vous pouvez arrêter l'horloge en activant l'interrupteur "Arrêter l'horloge". La date factice est alors réinitialisée à la dernière valeur que vous avez définie.

Pour changer de fuseau horaire, activez "Changer de fuseau horaire" et sélectionnez un fuseau horaire dans la liste déroulante.
Une fois activé, les objets Date, Intl.DateTimeFormat et Temporal.Now utilisent ce fuseau horaire à la place de celui du système.
La date et l'heure saisies sont alors elles aussi interprétées comme l'heure locale dans le fuseau horaire sélectionné (l'étiquette du champ affiche par ex. "Définir la date et l'heure (London)").
Passer à un autre fuseau horaire conserve la date et l'heure locales saisies, ce qui peut changer l'instant représenté (sauf si le champ de saisie contient un instant UTC).

Un badge à côté de l'heure effective de la page indique le décalage UTC utilisé, avec une icône signalant si la date tombe pendant l'heure d'été ou l'heure standard.
Survolez le badge avec la souris pour afficher plus de détails.

Exemples de dates et de formats :
- 2025-04-27 12:40 - Heure locale
- 2025-03-30 00:59:55 - En supposant que le fuseau horaire de votre système soit Europe/London (GMT), 5 secondes avant le saut d'une heure à 2 h du matin (heure d'été)
- 2025-04-27T12:40Z - Définit l'équivalent local d'une heure UTC donnée
- 2025-04-27T12:40+1130 - Définit l'équivalent local d'une heure avec un décalage de fuseau horaire de +11:30. Notez que le fuseau horaire réel n'est pas modifié
- 2025-03-25T12:40:00.120 - Heure locale avec millisecondes
- 1731493140025 - Horodatage UNIX

Cette extension est un logiciel open source distribué sous licence MIT.
