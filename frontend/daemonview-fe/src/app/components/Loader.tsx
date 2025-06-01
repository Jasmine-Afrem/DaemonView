import styled, { keyframes } from 'styled-components';

const whitechange = keyframes`
  0% {
    background-color: transparent;
    box-shadow: none;
  }
  25% {
    background-color: white;
  }
  50% {
    background-color: transparent;
    box-shadow: none;
  }
  100% {
    background-color: transparent;
    box-shadow: none;
  }
`;

const changefont = keyframes`
  0% {
    padding-bottom: 0em;
  }
  50% {
    padding-bottom: 0em;
  }
  75% {
    padding-bottom: 1em;
  }
  100% {
    color: #171030;
    padding-bottom: 0em;
  }
`;

const LoaderWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #090821;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
`;

const LoaderContainer = styled.div`
  width: 12em;
  height: 3em;
  color: white;
  font-weight: 300;
  font-style: oblique;
  display: flex;
  justify-content: space-between;
  align-items: center;

  p {
    font-size: 1.5em;
  }

  p:nth-child(1) { animation: ${changefont} 2s linear infinite; }
  p:nth-child(2) { animation: ${changefont} 2s linear infinite 0.1s; }
  p:nth-child(3) { animation: ${changefont} 2s linear infinite 0.2s; }
  p:nth-child(4) { animation: ${changefont} 2s linear infinite 0.3s; }
  p:nth-child(5) { animation: ${changefont} 2s linear infinite 0.4s; }
  p:nth-child(6) { animation: ${changefont} 2s linear infinite 0.5s; }
  p:nth-child(7) { animation: ${changefont} 2s linear infinite 0.6s; }
`;

const Arrows = styled.div`
  width: 1.75em;
  height: 2em;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5em;
`;

const ArrowsUp = styled.div`
  width: 100%;
  height: 25%;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ArrowsBottom = styled.div`
  width: 100%;
  height: 25%;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Arrow = styled.div`
  width: 0.75em;
  height: 0.75em;
  border: solid 0.05em transparent;
`;

const Arrow1 = styled(Arrow)`
  clip-path: polygon(100% 0%, 100% 0%, 100% 100%, 0% 100%);
  animation: ${whitechange} 2s linear infinite;
`;

const Arrow2 = styled(Arrow)`
  clip-path: polygon(0% 0%, 0% 0%, 100% 100%, 0% 100%);
  animation: ${whitechange} 2s linear infinite 0.5s;
`;

const Arrow3 = styled(Arrow)`
  clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 0%);
  animation: ${whitechange} 2s linear infinite 1.5s;
`;

const Arrow4 = styled(Arrow)`
  clip-path: polygon(0% 0%, 100% 0%, 0% 100%, 0% 100%);
  animation: ${whitechange} 2s linear infinite 1s;
`;

export default function Loader() {
  return (
    <LoaderWrapper>
      <LoaderContainer>
        <p>L</p>
        <p>O</p>
        <p>A</p>
        <p>D</p>
        <p>I</p>
        <p>N</p>
        <p>G</p>
        <Arrows>
          <ArrowsUp>
            <Arrow1 />
            <Arrow2 />
          </ArrowsUp>
          <ArrowsBottom>
            <Arrow3 />
            <Arrow4 />
          </ArrowsBottom>
        </Arrows>
      </LoaderContainer>
    </LoaderWrapper>
  );
} 