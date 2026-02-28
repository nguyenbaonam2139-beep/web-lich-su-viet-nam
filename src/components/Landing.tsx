import React from "react";

interface LandingProps {
  onStart: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onStart }) => {
  return (
    <div className="landing-root">
      <div className="landing-orbit landing-orbit-1" />
      <div className="landing-orbit landing-orbit-2" />

      <div className="landing-left">
        <div className="landing-tag-row">
          <span className="landing-tag">Bài học lịch sử</span>
          <span className="landing-tag landing-tag-soft">
            Tương tác · Trực quan
          </span>
        </div>

        <h1>
          Lịch sử không chỉ là{" "}
          <span className="landing-highlight">những con số khô khan</span>
        </h1>
        <p>
          Mỗi cột mốc là một câu chuyện về con người, lựa chọn và tương lai của
          dân tộc. Hiểu lịch sử giúp chúng ta biết mình là ai và sẽ đi về đâu.
        </p>
        <p>
          Hãy cùng bước vào hành trình từ 1945 đến nay để khám phá những khoảnh
          khắc đã định hình Việt Nam hiện đại.
        </p>

        <div className="landing-actions">
          <button className="landing-cta" onClick={onStart}>
            Khám phá ngay
          </button>
          <span className="landing-sub">
            Chỉ mất vài phút để đi qua hơn 70 năm lịch sử.
          </span>
        </div>
      </div>

      <div className="landing-right">
        <div className="landing-map-wrapper">
          <img
            src="https://cdn1.fahasa.com/media/catalog/product/3/9/3900000243490.jpg"
            alt="Bản đồ Việt Nam - Tôi yêu Việt Nam"
            className="landing-map-image"
          />
        </div>
      </div>
    </div>
  );
};

