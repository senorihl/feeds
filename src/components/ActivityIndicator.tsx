import React from "react";
import styled, {keyframes} from "@xstyled/styled-components";

const Holder = styled.div<{size: number}>`
  display: inline-block;
  position: relative;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
`

const rotate = (size: number) => {
    return keyframes`
  0% {
    top: ${size / 2 - size / 20}px;
    left: ${size / 2 - size / 20}px;
    width: 0;
    height: 0;
    opacity: 0;
  }
  4.9% {
    top: ${size / 2 - size / 20}px;
    left: ${size / 2 - size / 20}px;
    width: 0;
    height: 0;
    opacity: 0;
  }
  5% {
    top: ${size / 2 - size / 20}px;
    left: ${size / 2 - size / 20}px;
    width: 0;
    height: 0;
    opacity: 1;
  }
  100% {
    top: 0px;
    left: 0px;
    width: ${size - size / 20 * 2}px;
    height: ${size - size / 20 * 2}px;
    opacity: 0;
  }
`;
}


const Ripple = styled.div<{size: number, delay?: number, color?: string}>`
  position: absolute;
  border: ${props => props.size / 20}px solid ${props => props.color || '#fff'};
  opacity: 1;
  border-radius: 50%;
  animation: ${props => rotate(props.size)} 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
  ${props => props.delay ? `animation-delay: -${props.delay}s;` : ''}
`

export const ActivityIndicator: React.FC<{size?: number} & object> = ({size = 80, ...props}) => (
    <Holder size={size} {...props}>
        <Ripple size={size} color={'black'}/>
        <Ripple size={size} delay={0.5} color={'black'} />
    </Holder>
)
