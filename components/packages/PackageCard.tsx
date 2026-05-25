"use client";

/**
 * PackageCard — agency dashboard card for the Packages screen.
 *
 * Intentionally independent of BaseCard (components/templates/shared.tsx).
 * BaseCard backs the 10 landing-page templates' Card exports and must not
 * be modified for dashboard concerns. This component implements the .pcard
 * design spec (cards.css in the design bundle) for the admin dashboard only.
 * Do not re-merge them: the two surfaces have different layouts, visual
 * contracts, and change drivers.
 */

import type { TListPackage, TAgency } from "@/components/templates/types";
import { locStr } from "@/components/templates/types";
import type { Lang } from "@/lib/translations";
import { T } from "@/lib/translations";
import Icon from "@/components/Icon";

type Props = {
  pkg: TListPackage;
  agency: TAgency;
  lang: Lang;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onDuplicate?: () => void;
  onCopyLink?: () => void;
  stripeColor?: string;
  templateName?: string;
  templateDark?: boolean;
};

export function PackageCard({
  pkg, lang,
  onView, onEdit, onDelete, onToggleActive, onDuplicate, onCopyLink,
  stripeColor, templateName, templateDark,
}: Props) {
  const t = T[lang];
  const thumb = pkg.coverImage || pkg.images?.[0];
  const clicks = (pkg.whatsappClicks || 0) + (pkg.messengerClicks || 0);
  const conv = (pkg.views || 0) > 0 ? (clicks / (pkg.views || 1)) * 100 : 0;
  const isPublished = Boolean(pkg.agencySlug);
  const isActive = pkg.isActive !== false;
  const stripe = stripeColor || "#1f5f8e";
  const isOff = isPublished && !isActive;

  const statusClass =
    !isPublished ? "pcard__status pcard__status--draft" :
    isActive      ? "pcard__status pcard__status--live"  :
                    "pcard__status pcard__status--off";

  const statusLabel =
    !isPublished ? t.packageStatusDraft :
    isActive     ? t.live               :
                   t.packageStatusInactive;

  return (
    <article className={"pcard" + (isOff ? " pcard--inactive" : "")}>

      {/* Template stripe */}
      <div className="pcard__stripe" style={{ background: stripe }} />

      {/* Image */}
      <div className="pcard__media">
        {thumb
          ? <img src={thumb} alt={pkg.destination} />
          : <div className="pcard__media-no-img">
              <Icon name="map" size={28} color="rgba(0,0,0,0.2)" />
            </div>
        }
        <div className="pcard__media-tags">
          {templateName && (
            <span className="pcard__tpl">
              <span
                className="pcard__tpl-dot"
                style={{
                  background: stripe,
                  border: templateDark ? "1px solid rgba(0,0,0,0.5)" : "none",
                }}
              />
              {templateName}
            </span>
          )}
          <span className={statusClass}>
            <span className="dot" />
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="pcard__body">
        <div className="pcard__top">
          <div className="pcard__dest">{pkg.destination}</div>
          <div className="pcard__price">{pkg.price}</div>
        </div>
        <h3 className="pcard__title">{locStr(pkg.title, lang) || pkg.destination}</h3>

        <div className="pcard__metrics">
          <div className="pcard__metric">
            <div className="v">{(pkg.views || 0).toLocaleString()}</div>
            <div className="l">{t.statViews}</div>
          </div>
          <div className="pcard__metric">
            <div className="v">{clicks}</div>
            <div className="l">{t.statLeads}</div>
          </div>
          <div className="pcard__metric">
            <div className={"v" + (conv >= 2 ? " v--hi" : "")}>
              {conv > 0 ? conv.toFixed(1) + "%" : "—"}
            </div>
            <div className="l">{t.statConversion}</div>
          </div>
        </div>
      </div>

      {/* Actions bar */}
      <div className="pcard__actions">
        <button className="pcard__act pcard__act--primary" onClick={onEdit}>
          {t.apply}
        </button>
        <button className="pcard__act" onClick={onView}>
          {t.preview}
        </button>
        {onCopyLink && (
          <button className="pcard__act" onClick={onCopyLink}>
            {t.copyLink}
          </button>
        )}
        {onDuplicate && (
          <button className="pcard__act" onClick={onDuplicate} title={t.duplicatePackageTooltip}>
            <Icon name="copy" size={13} color="currentColor" />
          </button>
        )}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
          {isPublished && (
            <button
              className={"pcard__toggle" + (isActive ? "" : " pcard__toggle--off")}
              onClick={onToggleActive}
              title={isActive ? t.markInactive : t.markActive}
            />
          )}
          <button
            className="pcard__act"
            onClick={onDelete}
            title={t.deletePackage}
            style={{ padding: "5px 4px" }}
          >
            <Icon name="trash" size={13} color="rgba(180,50,50,0.55)" />
          </button>
        </div>
      </div>
    </article>
  );
}
