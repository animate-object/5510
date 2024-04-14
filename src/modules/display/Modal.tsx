import classNames from "classnames";
import React from "react";
import "./Modal.css";

interface ModalStyle {
  transparent?: boolean;
  halfScreen?: boolean;
  className?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  style?: ModalStyle;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  style,
}: Props): JSX.Element {
  const { transparent, halfScreen, className } = style || {
    transparent: false,
    halfScreen: false,
    className: undefined,
  };

  if (!isOpen) {
    return <div className="modal-closed" />;
  }

  return (
    <div
      className={classNames(
        "modal",
        className,
        { "modal-transparent": transparent },
        { "modal-half-screen": halfScreen }
      )}
    >
      <div className="modal-content">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <div role="button" className="modal-close" onClick={onClose}>
            x
          </div>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
